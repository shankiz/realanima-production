
import { NextRequest, NextResponse } from 'next/server';
import { PayPalSubscriptionService, SUBSCRIPTION_PLANS } from '@/services/PayPalSubscriptionService';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting subscription approval...');

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    if (!adminAuth) {
      console.error('❌ Firebase Admin not initialized');
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 500 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { orderId, planId } = await request.json();

    if (!orderId || !planId) {
      return NextResponse.json({ 
        error: 'Missing required fields: orderId, planId' 
      }, { status: 400 });
    }

    console.log('💰 Capturing PayPal order:', orderId);

    const paypalService = new PayPalSubscriptionService();
    const capturedOrder = await paypalService.captureOrder(orderId);

    console.log('✅ Payment captured:', capturedOrder.id);

    // Verify payment was successful
    if (capturedOrder.status !== 'COMPLETED') {
      console.error('❌ Payment failed:', capturedOrder);
      return NextResponse.json({ 
        error: 'Payment failed', 
        details: capturedOrder.status 
      }, { status: 400 });
    }

    // Get plan details
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Generate subscription ID
    const subscriptionId = `${decodedToken.uid}-${planId}-${Date.now()}`;

    console.log('✅ Payment processed successfully! Order ID:', capturedOrder.id);

    // Save subscription to Firebase
    const subscriptionData = {
      id: subscriptionId,
      userId: decodedToken.uid,
      planId,
      status: 'active',
      payerInfo: {
        email: decodedToken.email || 'unknown@example.com',
        payerId: capturedOrder.payer?.payer_id || 'unknown'
      },
      initialPayment: {
        orderId: capturedOrder.id,
        transactionId: capturedOrder.id,
        amount: plan.price,
        currency: 'USD',
        status: 'COMPLETED',
        paidAt: new Date()
      },
      createdAt: new Date(),
      nextBillingDate: new Date(Date.now() + (plan.interval === 'MONTH' ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)),
      lastChargedAt: new Date()
    };

    console.log('💾 Saving subscription data:', subscriptionData);

    try {
      if (!adminDb) {
        console.error('❌ Firebase Admin DB not initialized');
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      
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
          lastMessageReset: new Date(),
          'subscription.lastChargedAt': new Date().toISOString(),
          'subscription.nextBillingDate': new Date(Date.now() + (plan.interval === 'MONTH' ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString(),
          'subscription.status': 'active',
          'subscription.planId': planId,
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
          lastMessageReset: new Date(),
          subscription: {
            lastChargedAt: new Date().toISOString(),
            nextBillingDate: new Date(Date.now() + (plan.interval === 'MONTH' ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString(),
            status: 'active',
            planId: planId
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
      subscriptionId: subscriptionId,
      subscription: subscriptionData,
      planUpgraded: planId,
      payment: {
        orderId: capturedOrder.id,
        transactionId: capturedOrder.id,
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
