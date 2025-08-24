
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, forceDate } = await request.json();
    
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    if (userId) {
      // Test specific user
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const userData = userDoc.data();
      const subscription = userData?.subscription;

      if (!subscription) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
      }

      // Force next billing to now for testing
      const testDate = forceDate ? new Date(forceDate) : new Date();
      
      await adminDb.collection('users').doc(userId).update({
        'subscription.nextBillingDate': testDate.toISOString()
      });

      return NextResponse.json({
        success: true,
        message: `Updated next billing date for user ${userId}`,
        newBillingDate: testDate.toISOString(),
        previousBillingDate: subscription.nextBillingDate
      });
    }

    // Show all subscription debug info
    const usersSnapshot = await adminDb.collection('users')
      .where('subscription.status', '==', 'active')
      .get();

    const debugInfo = [];
    const now = new Date();

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const subscription = userData.subscription;
      
      if (subscription) {
        const nextBilling = new Date(subscription.nextBillingDate);
        debugInfo.push({
          userId: userDoc.id,
          email: userData.email,
          plan: subscription.planId,
          nextBilling: subscription.nextBillingDate,
          daysDiff: Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          shouldBillNow: nextBilling <= now,
          subscriptionId: subscription.id,
          createdAt: subscription.createdAt,
          lastChargedAt: subscription.lastChargedAt
        });
      }
    }

    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      subscriptions: debugInfo,
      instructions: {
        forceUserBilling: "POST with {\"userId\": \"USER_ID\"}",
        setCustomDate: "POST with {\"userId\": \"USER_ID\", \"forceDate\": \"2025-08-24T16:00:00.000Z\"}"
      }
    });

  } catch (error) {
    console.error('Test billing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
