import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyIdToken } from '@/lib/firebase/admin-helpers';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log(`🚫 Cancelling subscription for user: ${uid}`);

    // Get user's current subscription
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    let subscription = userData?.subscription || userData?.payerInfo;

    console.log(`📊 User data check:`, {
      currentPlan: userData?.currentPlan,
      hasSubscription: !!userData?.subscription,
      hasPayerInfo: !!userData?.payerInfo,
      subscriptionStatus: subscription?.status
    });

    // If user has premium/ultimate plan but no subscription data, create it first
    if ((userData?.currentPlan === 'premium' || userData?.currentPlan === 'ultimate') && !subscription) {
      console.log('🔄 Creating missing subscription data for cancellation...');
      subscription = {
        status: 'active',
        planId: userData.currentPlan,
        subscriptionId: `legacy-${uid}-${userData.currentPlan}`,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: userData.lastUpdated || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await userRef.update({
        subscription: subscription,
        lastUpdated: new Date().toISOString(),
      });
    }

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    // Check if subscription is already cancelled
    if (subscription.status === 'cancelled' || subscription.cancelledAt) {
      return NextResponse.json({ 
        error: 'Subscription is already cancelled',
        details: {
          status: subscription.status,
          cancelledAt: subscription.cancelledAt,
          accessUntil: subscription.nextBillingDate
        }
      }, { status: 400 });
    }

    if (subscription.status !== 'active') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Cancel the subscription (user keeps access until current billing period ends)
    await userRef.update({
      'subscription.status': 'cancelled',
      'subscription.cancelledAt': now,
      'subscription.cancelReason': 'user_requested',
      'subscription.updatedAt': now,
    });

    // Also update the user's plan status if needed
    const updateData: any = {
      'subscription.status': 'cancelled',
      'subscription.cancelledAt': now,
      'subscription.cancelReason': 'user_requested',
      'subscription.updatedAt': now,
    };

    await userRef.update(updateData);

    console.log(`✅ Subscription cancelled successfully for user: ${uid}`);
    console.log(`📊 User will retain access until: ${subscription.nextBillingDate}`);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
      accessUntil: subscription.nextBillingDate || 'immediately',
      status: 'cancelled'
    });

  } catch (error: unknown) {
    console.error('❌ Cancel subscription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}