import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
// import { getUserDataAdmin } from '@/lib/firebase/admin-helpers';

// Assume PayPalSubscriptionService is imported and configured correctly elsewhere
// import PayPalSubscriptionService from '@/lib/paypal-service'; // Placeholder for actual import

class PayPalSubscriptionService {
  async getSubscriptionDetails(subscriptionId: string) {
    // This is a mock implementation. Replace with actual PayPal API call.
    console.log(`Mock: Fetching details for subscription ID: ${subscriptionId}`);
    // Simulate a response that includes next_billing_time
    if (subscriptionId.startsWith('legacy-')) {
      // Simulate legacy data without time
      return {
        status: 'ACTIVE',
        planId: 'plan_abc',
        billing_info: {
          next_billing_time: '2025-08-21T10:00:00Z', // Example with time
          last_payment: { time: '2025-07-21T10:00:00Z' }
        }
      };
    }
    return {
      status: 'ACTIVE',
      planId: 'plan_xyz',
      billing_info: {
        next_billing_time: '2025-09-15T12:30:00Z',
        last_payment: { time: '2025-08-15T12:30:00Z' }
      }
    };
  }
}


export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

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
    const subscriptionData = userData?.subscription; // Renamed for clarity

    console.log('📊 Fetching subscription status for user:', uid);
    console.log('📊 Current subscription data:', subscriptionData);

    console.log('📊 User data for subscription status:', {
      uid,
      currentPlan: userData?.currentPlan,
      credits: userData?.credits,
      hasPayerInfo: !!userData?.payerInfo,
      payerInfo: userData?.payerInfo,
      hasSubscription: !!subscriptionData,
      subscription: subscriptionData
    });

    // For users with premium/ultimate plans but missing subscription data, create and save a basic structure
    const shouldHaveSubscription = userData?.currentPlan && userData?.currentPlan !== 'free';
    let finalSubscription = subscriptionData;

    if (shouldHaveSubscription && !subscriptionData) {
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

    // If subscription data exists, fetch real-time details from PayPal
    if (finalSubscription && finalSubscription.subscriptionId) {
      // Get subscription details from PayPal for real-time status
      const paypalService = new PayPalSubscriptionService();
      const subscriptionDetails = await paypalService.getSubscriptionDetails(finalSubscription.subscriptionId);

      console.log('📊 PayPal subscription details:', subscriptionDetails);

      finalSubscription = {
        status: subscriptionDetails.status || finalSubscription.status,
        planId: subscriptionDetails.planId || finalSubscription.planId,
        nextBillingDate: subscriptionDetails.billing_info?.next_billing_time || finalSubscription.nextBillingDate,
        lastChargedAt: subscriptionDetails.billing_info?.last_payment?.time || finalSubscription.lastChargedAt,
        cancelledAt: subscriptionDetails.cancelledAt || finalSubscription.cancelledAt,
        cancelReason: subscriptionDetails.cancelReason || finalSubscription.cancelReason
      };
    }


    return NextResponse.json({
      currentPlan: userData?.currentPlan || 'free',
      credits: userData?.credits || 0,
      subscription: finalSubscription ? {
        status: finalSubscription.status,
        planId: finalSubscription.planId,
        subscriptionId: finalSubscription.subscriptionId || finalSubscription.id, // Ensure subscriptionId is present
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