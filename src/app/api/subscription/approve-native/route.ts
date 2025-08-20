import { NextRequest, NextResponse } from 'next/server';
import { PayPalSubscriptionService, SUBSCRIPTION_PLANS } from '@/services/PayPalSubscriptionService';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId, userId, planId } = await req.json();

    if (!subscriptionId || !userId || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const paypalService = new PayPalSubscriptionService();

    // Get subscription details from PayPal
    const subscriptionDetails = await paypalService.getSubscriptionDetails(subscriptionId);

    console.log('📋 Subscription details:', {
      id: subscriptionDetails.id,
      status: subscriptionDetails.status,
      plan_id: subscriptionDetails.plan_id
    });

    if (subscriptionDetails.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Subscription not active' },
        { status: 400 }
      );
    }

    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Calculate next billing date
    const now = new Date();
    // Calculate next billing date (daily for testing)
    const nextBillingDate = new Date();
    nextBillingDate.setDate(nextBillingDate.getDate() + 1);

    // Update user with subscription and credits
    await adminDb.collection('users').doc(userId).update({
      credits: plan.credits,
      messagesLeft: plan.credits,
      currentPlan: planId,
      subscriptionId: subscriptionId,
      subscriptionStatus: 'active',
      paypalSubscriptionId: subscriptionId,
      lastMessageReset: now,
      subscription: {
        id: subscriptionId,
        status: 'active',
        planId: planId,
        paypalPlanId: subscriptionDetails.plan_id,
        lastChargedAt: now.toISOString(),
        nextBillingDate: nextBillingDate.toISOString(),
        isNativePayPal: true
      },
      lastUpdated: now
    });

    console.log(`✅ Subscription activated for user ${userId}: ${planId}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully!',
      credits: plan.credits
    });

  } catch (error) {
    console.error('❌ Native subscription approval error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}