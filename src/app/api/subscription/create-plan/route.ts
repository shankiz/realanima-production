import { NextRequest, NextResponse } from 'next/server';
import { PayPalSubscriptionService } from '@/services/PayPalSubscriptionService';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const { planId, userId, userEmail, userName } = await req.json();

    if (!planId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 500 }
      );
    }

    const paypalService = new PayPalSubscriptionService();

    // Create subscriber info
    const subscriberInfo = {
      name: {
        given_name: userName.split(' ')[0] || 'User',
        surname: userName.split(' ')[1] || 'User'
      },
      email_address: userEmail
    };

    // Create the PayPal subscription
    const subscription = await paypalService.createActualSubscription(planId, subscriberInfo);

    // Store subscription info in Firebase
    await adminDb.collection('users').doc(userId).update({
      'subscription.id': subscription.id,
      'subscription.planId': planId,
      'subscription.status': 'pending',
      'subscription.createdAt': new Date().toISOString(),
      'subscription.paypalSubscriptionId': subscription.id,
    });

    // Return the subscription ID for the PayPal subscription creation
    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      paypalPlanId: subscription.plan_id
    });

  } catch (error) {
    console.error('Create subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription' },
      { status: 500 }
    );
  }
}