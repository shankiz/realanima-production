
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
