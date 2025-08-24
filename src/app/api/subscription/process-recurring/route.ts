import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { PayPalSubscriptionService, SUBSCRIPTION_PLANS } from '@/services/PayPalSubscriptionService';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing recurring billing...');

    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const now = new Date();
    const paypalService = new PayPalSubscriptionService();
    const results: any[] = [];
    let processed = 0;

    // Find all active subscriptions that need billing
    const usersSnapshot = await adminDb.collection('users')
      .where('subscription.status', '==', 'active')
      .get();

    console.log(`📊 Found ${usersSnapshot.size} active subscriptions to check`);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const subscription = userData.subscription;

      if (!subscription?.id || !subscription.nextBillingDate) {
        console.log(`⚠️ Skipping user ${userId} - missing subscription data`);
        continue;
      }

      const nextBillingDate = new Date(subscription.nextBillingDate);
      const shouldBill = nextBillingDate <= now;

      console.log(`👤 User ${userId}: Next billing ${nextBillingDate.toISOString()}, Should bill: ${shouldBill}`);

      if (shouldBill) {
        try {
          // Get fresh PayPal subscription details
          const paypalDetails = await paypalService.getSubscriptionDetails(subscription.id);

          if (paypalDetails && paypalDetails.status === 'ACTIVE') {
            // Calculate next billing date (daily)
            const newNextBilling = new Date(now);
            newNextBilling.setDate(newNextBilling.getDate() + 1);

            // Reset credits based on plan
            let newCredits = 30; // free default
            if (subscription.planId === 'premium') {
              newCredits = 200;
            } else if (subscription.planId === 'ultimate') {
              newCredits = 500;
            }

            // Update user data
            await adminDb.collection('users').doc(userId).update({
              credits: newCredits,
              messagesLeft: newCredits,
              'subscription.lastChargedAt': now.toISOString(),
              'subscription.nextBillingDate': newNextBilling.toISOString(),
              'subscription.status': 'active',
            });

            results.push({
              userId,
              email: userData.email,
              action: 'credits_renewed',
              newCredits,
              nextBilling: newNextBilling.toISOString()
            });

            processed++;
            console.log(`✅ Renewed credits for user ${userId}: ${newCredits} credits`);
          } else {
            console.log(`⚠️ PayPal subscription ${subscription.id} is not active`);
          }
        } catch (error) {
          console.error(`❌ Error processing billing for user ${userId}:`, error);
          results.push({
            userId,
            email: userData.email,
            action: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Also handle cancelled subscriptions that have reached their end date
    const cancelledSnapshot = await adminDb.collection('users')
      .where('subscription.status', '==', 'cancelled')
      .get();

    for (const userDoc of cancelledSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const subscription = userData.subscription;

      if (!subscription?.nextBillingDate) {
        continue;
      }

      const endDate = new Date(subscription.nextBillingDate);

      // Check if access should end
      if (now >= endDate) {
        try {
          console.log(`⬇️ Downgrading expired cancelled subscription for user ${userId}`);

          await adminDb.collection('users').doc(userId).update({
            currentPlan: 'free',
            credits: 10, // Reset to free tier credits
            messagesLeft: 30, // Reset to free tier message limit
            'subscription.status': 'expired',
            'subscription.expiredAt': now.toISOString(),
          });

          results.push({
            userId,
            success: true,
            action: 'downgraded_expired',
          });

        } catch (error: unknown) {
          console.error(`❌ Failed to downgrade expired user ${userId}:`, error);
          results.push({
            userId,
            success: false,
            action: 'downgrade_failed',
            error: error instanceof Error ? (error as Error).message : 'Unknown error',
          });
        }
      }
    }

    console.log(`🎯 Billing processing complete. Processed: ${processed}`);

    return NextResponse.json({
      success: true,
      processed,
      results,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error('❌ Recurring billing error:', error);
    return NextResponse.json(
      { error: 'Failed to process recurring billing' },
      { status: 500 }
    );
  }
}