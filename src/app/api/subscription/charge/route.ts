import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { PayPalSubscriptionService } from '@/services/PayPalSubscriptionService';

export async function POST(request: NextRequest) {
  try {
    const { userId, forceCharge } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`💳 Processing charge for user ${userId}`);

    // Get user data
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

    console.log(`🔍 Subscription data for user ${userId}:`, {
      hasSubscription: !!subscription,
      hasPaymentTokenId: !!subscription?.paymentTokenId,
      hasPlanId: !!subscription?.planId,
      planId: subscription?.planId,
      status: subscription?.status,
      subscriptionId: subscription?.subscriptionId
    });

    if (!subscription?.paymentTokenId || !subscription?.planId) {
      console.log(`❌ Missing required subscription data for user ${userId}:`, {
        paymentTokenId: subscription?.paymentTokenId,
        planId: subscription?.planId,
        fullSubscription: subscription
      });
      return NextResponse.json(
        { success: false, error: 'No active subscription found' },
        { status: 400 }
      );
    }

    // Check if billing is due (unless force charge)
    if (!forceCharge && subscription.nextBillingDate) {
      const nextBillingDate = new Date(subscription.nextBillingDate);
      const now = new Date();

      if (now < nextBillingDate) {
        return NextResponse.json(
          { success: false, error: 'Billing not due yet' },
          { status: 400 }
        );
      }
    }

    // Charge the subscription
    const paypalService = new PayPalSubscriptionService();
    const chargeResult = await paypalService.chargeRecurringSubscription(
      subscription.paymentTokenId,
      subscription.planId,
      subscription.subscriptionId
    );

    if (chargeResult.success) {
      // Define credits per plan
      const planCredits = {
        premium: 200,
        ultimate: 500
      };
      // Calculate next billing date (add 1 day for testing)
      const nextBillingDate = new Date();
      nextBillingDate.setDate(nextBillingDate.getDate() + 1);

      // Update user subscription
      await adminDb.collection('users').doc(userId).update({
        'subscription.lastChargedAt': new Date().toISOString(),
        'subscription.nextBillingDate': nextBillingDate.toISOString(),
        'subscription.paymentHistory': FieldValue.arrayUnion({
          orderId: chargeResult.orderId,
          amount: subscription.planId === 'premium' ? 0.33 : 0.67,
          date: new Date().toISOString(),
          status: 'completed'
        })
      });

      console.log(`✅ Successfully charged user ${userId}`);

      return NextResponse.json({
        success: true,
        orderId: chargeResult.orderId,
        nextBillingDate: nextBillingDate.toISOString()
      });
    } else {
      console.error(`❌ Failed to charge user ${userId}:`, chargeResult.error);

      return NextResponse.json(
        { success: false, error: chargeResult.error },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Error processing charge:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}