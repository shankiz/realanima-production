import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { PayPalSubscriptionService } from '@/services/PayPalSubscriptionService';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔄 Syncing PayPal subscription for user ${userId}`);

    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 500 }
      );
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const subscription = userData?.subscription;

    if (!subscription?.id) {
      return NextResponse.json(
        { success: false, error: 'No PayPal subscription found' },
        { status: 400 }
      );
    }

    // Get current subscription details from PayPal
    const paypalService = new PayPalSubscriptionService();
    const subscriptionDetails = await paypalService.getSubscriptionDetails(subscription.id);

    console.log('📋 PayPal subscription details:', subscriptionDetails);

    // Check if there are recent payments we missed
    const lastBillingCycle = subscriptionDetails.billing_info?.last_payment;
    const nextBillingTime = subscriptionDetails.billing_info?.next_billing_time;

    let updatedFields: any = {
      'subscription.status': subscriptionDetails.status.toLowerCase(),
    };

    // If there was a recent payment, update credits and billing info
    if (lastBillingCycle?.time) {
      const lastPaymentDate = new Date(lastBillingCycle.time);
      const storedLastCharged = subscription.lastChargedAt ? new Date(subscription.lastChargedAt) : null;

      // If PayPal shows a more recent payment than what we have stored
      if (!storedLastCharged || lastPaymentDate > storedLastCharged) {
        console.log('💳 Found newer payment, updating user credits');

        // Reset credits based on plan
        let newCredits = 10; // free default
        if (subscription.planId === 'premium') {
          newCredits = 200;
        } else if (subscription.planId === 'ultimate') {
          newCredits = 500;
        }

        updatedFields = {
          ...updatedFields,
          credits: newCredits,
          messagesLeft: newCredits,
          'subscription.lastChargedAt': lastPaymentDate.toISOString(),
        };
      }
    }

    // Update next billing date if available
    if (nextBillingTime) {
      updatedFields['subscription.nextBillingDate'] = new Date(nextBillingTime).toISOString();
    } else {
      // Calculate next billing based on subscription frequency
      let nextBilling;
      if (subscriptionDetails.billing_info?.next_billing_time) {
        nextBilling = new Date(subscriptionDetails.billing_info.next_billing_time);
      } else {
        // Fallback: calculate based on plan frequency
        const billingFrequency = subscriptionDetails.plan?.billing_cycles?.[0]?.frequency || { interval_unit: 'DAY', interval_count: 1 };
        nextBilling = new Date();

        if (billingFrequency.interval_unit === 'DAY') {
          nextBilling.setDate(nextBilling.getDate() + (billingFrequency.interval_count || 1));
        } else if (billingFrequency.interval_unit === 'MONTH') {
          nextBilling.setMonth(nextBilling.getMonth() + (billingFrequency.interval_count || 1));
        } else if (billingFrequency.interval_unit === 'YEAR') {
          nextBilling.setFullYear(nextBilling.getFullYear() + (billingFrequency.interval_count || 1));
        } else {
          // Default fallback to daily
          nextBilling.setDate(nextBilling.getDate() + 1);
        }
      }
      updatedFields['subscription.nextBillingDate'] = nextBilling.toISOString();
    }


    // Update user data
    await adminDb.collection('users').doc(userId).update(updatedFields);

    console.log('✅ Successfully synced PayPal subscription for user:', userId);

    return NextResponse.json({
      success: true,
      subscription: subscriptionDetails,
      updated: Object.keys(updatedFields)
    });

  } catch (error) {
    console.error('❌ Error syncing PayPal subscription:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}