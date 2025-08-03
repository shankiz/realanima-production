import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function processRecurringBilling(request: Request) {
  return POST(request as NextRequest);
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Processing all recurring charges...');

    // Get all users with active subscriptions
    const usersSnapshot = await adminDb.collection('users')
      .where('subscription.status', '==', 'active')
      .get();

    // Also check for cancelled subscriptions that have reached their end date
    const cancelledSnapshot = await adminDb.collection('users')
      .where('subscription.status', '==', 'cancelled')
      .get();

    const results = [];
    const now = new Date();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      const subscription = userData.subscription;

      if (!subscription?.nextBillingDate) {
        continue;
      }

      const nextBillingDate = new Date(subscription.nextBillingDate);

      // Check if it's time to charge this user
      if (now >= nextBillingDate) {
        try {
          console.log(`💳 Processing charge for user ${userId}`);

          // Import and call the charge function directly instead of making HTTP request
          const { POST: chargeFunction } = await import('../charge/route');
          const mockChargeRequest = new Request('http://localhost/api/subscription/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              forceCharge: true,
            }),
          });

          const chargeResponse = await chargeFunction(mockChargeRequest as any);
          const chargeResult = await chargeResponse.json();

          results.push({
            userId,
            success: chargeResponse.ok,
            result: chargeResult,
          });

        } catch (error: unknown) {
          console.error(`❌ Failed to charge user ${userId}:`, error);
          results.push({
            userId,
            success: false,
            error: error instanceof Error ? (error as Error).message : 'Unknown error',
          });
        }
      }
    }

    // Handle cancelled subscriptions that have reached their end date
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

    console.log(`✅ Processed ${results.length} billing operations`);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });

  } catch (error: unknown) {
    console.error('❌ Error processing recurring charges:', error);
    return NextResponse.json(
      { error: error instanceof Error ? (error as Error).message : 'Internal server error' },
      { status: 500 }
    );
  }
}