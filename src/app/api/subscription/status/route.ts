import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { getUserDataAdmin } from '@/lib/firebase/admin-helpers';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user's subscription data with freshest possible data
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const subscription = userData?.subscription || userData?.payerInfo;

    console.log('📊 Fetching subscription status for user:', uid);
    console.log('📊 Current subscription data:', subscription);

    console.log('📊 User data for subscription status:', {
      uid,
      currentPlan: userData?.currentPlan,
      credits: userData?.credits,
      hasPayerInfo: !!userData?.payerInfo,
      payerInfo: userData?.payerInfo,
      hasSubscription: !!subscription,
      subscription: subscription
    });

    // For users with premium/ultimate plans but missing subscription data, create and save a basic structure
    const shouldHaveSubscription = userData?.currentPlan && userData?.currentPlan !== 'free';
    let finalSubscription = subscription;

    if (shouldHaveSubscription && !subscription) {
      console.log('⚠️ User has premium plan but missing subscription data, creating and saving basic structure');
      finalSubscription = {
        status: 'active',
        planId: userData.currentPlan,
        subscriptionId: `legacy-${uid}-${userData.currentPlan}`,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        createdAt: userData.lastUpdated || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save the subscription data to the database
      await userRef.update({
        subscription: finalSubscription,
        lastUpdated: new Date().toISOString(),
      });

      console.log(`✅ Created subscription data for user ${uid} with plan ${userData.currentPlan}`);
    }

    return NextResponse.json({
      currentPlan: userData?.currentPlan || 'free',
      credits: userData?.credits || 0,
      subscription: finalSubscription ? {
        status: finalSubscription.status,
        planId: finalSubscription.planId,
        subscriptionId: finalSubscription.subscriptionId || finalSubscription.id,
        nextBillingDate: finalSubscription.nextBillingDate,
        lastChargedAt: finalSubscription.createdAt || finalSubscription.lastChargedAt,
        cancelledAt: finalSubscription.cancelledAt,
        cancelReason: finalSubscription.cancelReason,
      } : null
    });

  } catch (error) {
    console.error('❌ Get subscription status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}