
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    console.log('📊 Fetching active subscriptions...');

    // Get all users with active subscriptions
    const activeSnapshot = await adminDb.collection('users')
      .where('subscription.status', '==', 'active')
      .get();

    // Get all users with cancelled subscriptions (still have access)
    const cancelledSnapshot = await adminDb.collection('users')
      .where('subscription.status', '==', 'cancelled')
      .get();

    const activeSubscriptions: any[] = [];
    const now = new Date();

    // Process active subscriptions
    activeSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const subscription = userData.subscription;
      
      if (subscription) {
        activeSubscriptions.push({
          userId: doc.id,
          email: userData.email,
          currentPlan: userData.currentPlan,
          credits: userData.credits,
          status: subscription.status,
          planId: subscription.planId,
          nextBillingDate: subscription.nextBillingDate,
          subscriptionId: subscription.subscriptionId,
          createdAt: subscription.createdAt,
          daysSinceCreated: subscription.createdAt ? 
            Math.floor((now.getTime() - new Date(subscription.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
        });
      }
    });

    // Process cancelled subscriptions (still active until end date)
    cancelledSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const subscription = userData.subscription;
      
      if (subscription && subscription.nextBillingDate) {
        const endDate = new Date(subscription.nextBillingDate);
        const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilEnd > 0) { // Still has access
          activeSubscriptions.push({
            userId: doc.id,
            email: userData.email,
            currentPlan: userData.currentPlan,
            credits: userData.credits,
            status: subscription.status,
            planId: subscription.planId,
            nextBillingDate: subscription.nextBillingDate,
            subscriptionId: subscription.subscriptionId,
            cancelledAt: subscription.cancelledAt,
            cancelReason: subscription.cancelReason,
            daysUntilEnd: daysUntilEnd,
            daysSinceCreated: subscription.createdAt ? 
              Math.floor((now.getTime() - new Date(subscription.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
          });
        }
      }
    });

    // Sort by creation date (newest first)
    activeSubscriptions.sort((a, b) => {
      const aDate = new Date(a.createdAt || 0);
      const bDate = new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });

    console.log(`📊 Found ${activeSubscriptions.length} active subscriptions`);

    return NextResponse.json({
      success: true,
      activeSubscriptions,
      totalActive: activeSubscriptions.length,
      summary: {
        totalSubscriptions: activeSubscriptions.length,
        activeSubscriptions: activeSubscriptions.filter(sub => sub.status === 'active').length,
        cancelledButActive: activeSubscriptions.filter(sub => sub.status === 'cancelled').length,
        premiumUsers: activeSubscriptions.filter(sub => sub.currentPlan === 'premium').length,
        ultimateUsers: activeSubscriptions.filter(sub => sub.currentPlan === 'ultimate').length
      }
    });

  } catch (error) {
    console.error('❌ Error fetching active subscriptions:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
