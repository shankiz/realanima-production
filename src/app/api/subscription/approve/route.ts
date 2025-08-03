import { NextRequest, NextResponse } from 'next/server';
import { PayPalSubscriptionService, SUBSCRIPTION_PLANS } from '@/services/PayPalSubscriptionService';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
// import { doc, setDoc, updateDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting subscription approval...');

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { setupTokenId, planId } = await request.json();

    if (!setupTokenId || !planId) {
      return NextResponse.json({ 
        error: 'Missing required fields: setupTokenId, planId' 
      }, { status: 400 });
    }

    console.log('🔄 Creating payment token from setup token:', setupTokenId);

    const paypalService = new PayPalSubscriptionService();
    const paymentToken = await paypalService.createPaymentToken(setupTokenId);

    console.log('✅ Payment token created:', paymentToken.id);

    // Get plan details
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Generate subscription ID
    const subscriptionId = `${decodedToken.uid}-${planId}-${Date.now()}`;

    console.log('💳 Creating immediate payment order for subscription...');

    // Create and capture order immediately (like PayPal standard example)
    const order = await paypalService.createSubscriptionOrder(paymentToken.id, planId);
    console.log('📦 Order created:', order.id);

    let finalOrder = order;
    
    // Only capture if the order is not already completed
    if (order.status === 'CREATED' || order.status === 'APPROVED') {
      console.log('🔄 Order needs capture, capturing...');
      const captureResult = await paypalService.captureOrder(order.id);
      console.log('💰 Payment captured:', captureResult.id);
      finalOrder = captureResult;
    } else if (order.status === 'COMPLETED') {
      console.log('✅ Order was already completed during creation (vault payment)');
    } else {
      console.error('❌ Unexpected order status:', order.status);
      return NextResponse.json({ 
        error: 'Payment failed', 
        details: `Unexpected order status: ${order.status}` 
      }, { status: 400 });
    }

    // Verify payment was successful
    if (finalOrder.status !== 'COMPLETED') {
      console.error('❌ Payment failed:', finalOrder);
      return NextResponse.json({ 
        error: 'Payment failed', 
        details: finalOrder.status 
      }, { status: 400 });
    }

    console.log('✅ Payment processed successfully! Order ID:', finalOrder.id);

    // Save subscription to Firebase
    const subscriptionData = {
      id: subscriptionId,
      userId: decodedToken.uid,
      planId,
      status: 'active',
      paymentTokenId: paymentToken.id,
      payerInfo: {
        email: paymentToken.payment_source?.paypal?.email_address || decodedToken.email || 'unknown@example.com',
        payerId: paymentToken.payment_source?.paypal?.payer_id || paymentToken.customer?.id || 'unknown'
      },
      // Add transaction details
      initialPayment: {
        orderId: finalOrder.id,
        transactionId: finalOrder.id,
        amount: plan.price,
        currency: 'USD',
        status: 'COMPLETED',
        paidAt: new Date()
      },
      createdAt: new Date(),
      nextBillingDate: new Date(Date.now() + (plan.interval === 'DAY' ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)),
      lastChargedAt: new Date()
    };

    console.log('💾 Saving subscription data:', subscriptionData);

    try {
      // Save to Firestore using admin SDK
      const subscriptionRef = adminDb.collection('subscriptions').doc(subscriptionId);
      await subscriptionRef.set(subscriptionData);

      console.log('✅ Subscription saved to Firestore');

      // Update user credits - first check if user document exists
      const userRef = adminDb.collection('users').doc(decodedToken.uid);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        await userRef.update({
          messagesLeft: plan.credits,
          credits: plan.credits,
          currentPlan: planId,
          subscriptionId: subscriptionId,
          subscriptionStatus: 'active',
          lastMessageReset: new Date(), // Initialize message reset tracking
          'subscription.lastChargedAt': new Date().toISOString(),
          'subscription.nextBillingDate': new Date(Date.now() + (plan.interval === 'DAY' ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)).toISOString(),
          'subscription.status': 'active',
          'subscription.planId': planId,
          'subscription.paymentTokenId': paymentToken.id,
          lastUpdated: new Date()
        });
      } else {
        // Create user document if it doesn't exist
        await userRef.set({
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || 'User',
          messagesLeft: plan.credits,
          credits: plan.credits,
          currentPlan: planId,
          subscriptionId: subscriptionId,
          subscriptionStatus: 'active',
          lastMessageReset: new Date(), // Initialize message reset tracking
          subscription: {
            lastChargedAt: new Date().toISOString(),
            nextBillingDate: new Date(Date.now() + (plan.interval === 'DAY' ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000)).toISOString(),
            status: 'active',
            planId: planId,
            paymentTokenId: paymentToken.id
          },
          createdAt: new Date(),
          lastUpdated: new Date()
        });
      }

      console.log('✅ User credits updated');
    } catch (firestoreError) {
      console.error('❌ Firestore error:', firestoreError);
      return NextResponse.json({ 
        error: 'Database error', 
        details: firestoreError instanceof Error ? firestoreError.message : 'Unknown error' 
      }, { status: 500 });
    }

    console.log('✅ User plan upgraded to:', planId);

    return NextResponse.json({
      success: true,
      paymentToken: paymentToken.id,
      subscriptionId: subscriptionId,
      subscription: subscriptionData,
      planUpgraded: planId,
      // Add payment confirmation details
      payment: {
        orderId: finalOrder.id,
        transactionId: finalOrder.id,
        amount: plan.price,
        status: 'COMPLETED'
      }
    });

  } catch (error) {
    console.error('❌ Subscription approval error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}