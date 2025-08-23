import { NextRequest, NextResponse } from 'next/server';
import { PayPalSubscriptionService, SUBSCRIPTION_PLANS } from '@/services/PayPalSubscriptionService';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🎉 Starting native PayPal subscription approval...');

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

    const { subscriptionId, planId } = await request.json();

    if (!subscriptionId || !planId) {
      return NextResponse.json({
        error: 'Missing required fields: subscriptionId, planId'
      }, { status: 400 });
    }

    console.log('🔍 Processing subscription approval for user', decodedToken.uid, 'subscription', subscriptionId, 'plan', planId);

    // Get subscription details from PayPal
    const paypalService = new PayPalSubscriptionService();
    const subscriptionDetails = await paypalService.getSubscriptionDetails(subscriptionId);

    console.log('📋 Subscription details:', {
      id: subscriptionDetails.id,
      status: subscriptionDetails.status,
      plan_id: subscriptionDetails.plan_id
    });

    // Verify subscription is active
    if (subscriptionDetails.status !== 'ACTIVE') {
      return NextResponse.json({
        error: 'Subscription is not active',
        status: subscriptionDetails.status
      }, { status: 400 });
    }

    // Get plan details
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Update user in Firebase
    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const userRef = adminDb.collection('users').doc(decodedToken.uid);
    const userDoc = await userRef.get();

    const now = new Date();

    // ALWAYS use PayPal's real billing dates - they are the source of truth
    const paypalNextBilling = subscriptionDetails.billing_info?.next_billing_time;
    const paypalLastPayment = subscriptionDetails.billing_info?.last_payment?.time;

    console.log('📊 Using PayPal billing dates:', {
      paypalNextBilling,
      paypalLastPayment,
      subscriptionStatus: subscriptionDetails.status
    });

    const userData = {
      messagesLeft: plan.credits,
      currentPlan: planId,
      subscription: {
        id: subscriptionId,
        status: subscriptionDetails.status?.toLowerCase() || 'active',
        planId: planId,
        paypalPlanId: subscriptionDetails.plan_id,
        // Use PayPal's real billing dates - never calculate them
        lastChargedAt: paypalLastPayment || now.toISOString(),
        nextBillingDate: paypalNextBilling || now.toISOString(),
        isNativePayPal: true
      },
      credits: plan.credits,
      paypalSubscriptionId: subscriptionId,
      lastMessageReset: now,
      lastUpdated: now
    };

    if (userDoc.exists) {
      await userRef.update(userData);
    } else {
      await userRef.set({
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name || 'User',
        createdAt: now,
        ...userData
      });
    }

    console.log('✅ Updated user', decodedToken.uid, 'with native subscription', subscriptionId);

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully!',
      subscription: 'success'
    });

  } catch (error) {
    console.error('❌ Native subscription approval error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}