
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { PayPalSubscriptionService } from '@/services/PayPalSubscriptionService';

export async function POST(req: NextRequest) {
  try {
    console.log('🔄 Manual PayPal sync started');

    if (!adminDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const paypalService = new PayPalSubscriptionService();
    const results = [];

    // Get all users with active PayPal subscriptions
    const usersSnapshot = await adminDb.collection('users')
      .where('subscription.status', '==', 'active')
      .where('subscription.isNativePayPal', '==', true)
      .get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const subscriptionId = userData.subscription?.id;

      if (!subscriptionId) continue;

      try {
        // Get latest subscription details from PayPal
        const paypalDetails = await paypalService.getSubscriptionDetails(subscriptionId);
        
        console.log(`📊 PayPal details for ${userId}:`, paypalDetails);

        // Check if we need to update billing dates
        const lastBillingCycle = paypalDetails.billing_info?.last_payment;
        const nextBillingCycle = paypalDetails.billing_info?.next_billing_time;

        if (lastBillingCycle && nextBillingCycle) {
          const currentNextBilling = userData.subscription?.nextBillingDate;
          const paypalNextBilling = new Date(nextBillingCycle).toISOString();

          // If PayPal's next billing date is different, update it
          if (currentNextBilling !== paypalNextBilling) {
            console.log(`🔄 Updating billing dates for user ${userId}`);
            
            await adminDb.collection('users').doc(userId).update({
              'subscription.lastChargedAt': new Date(lastBillingCycle.time).toISOString(),
              'subscription.nextBillingDate': paypalNextBilling,
              'subscription.status': paypalDetails.status.toLowerCase(),
            });

            results.push({
              userId,
              action: 'updated',
              oldNextBilling: currentNextBilling,
              newNextBilling: paypalNextBilling,
            });
          } else {
            results.push({
              userId,
              action: 'no_change',
              nextBilling: paypalNextBilling,
            });
          }
        }

      } catch (error) {
        console.error(`❌ Error syncing user ${userId}:`, error);
        results.push({
          userId,
          action: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('✅ PayPal sync completed');

    return NextResponse.json({
      success: true,
      synced: results.length,
      results,
    });

  } catch (error) {
    console.error('❌ PayPal sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    );
  }
}
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
