
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { PayPalSubscriptionService } from '@/services/PayPalSubscriptionService';

export async function POST(req: NextRequest) {
  try {
    console.log('🔔 PayPal webhook received');

    const webhookData = await req.json();
    const eventType = webhookData.event_type;
    
    console.log('📋 Webhook event type:', eventType);
    console.log('📋 Webhook data:', JSON.stringify(webhookData, null, 2));

    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    switch (eventType) {
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(webhookData);
        break;
        
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(webhookData);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(webhookData);
        break;
        
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(webhookData);
        break;
        
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(webhookData);
        break;
        
      default:
        console.log('ℹ️ Unhandled webhook event:', eventType);
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentCompleted(webhookData: any) {
  try {
    console.log('💳 Processing payment completed');
    
    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return;
    }
    
    // Get subscription ID from the webhook data
    const subscriptionId = webhookData.resource?.billing_agreement_id || 
                          webhookData.resource?.subscription_id;
    
    if (!subscriptionId) {
      console.log('⚠️ No subscription ID found in payment data');
      return;
    }

    // Find user with this PayPal subscription ID
    const usersSnapshot = await adminDb.collection('users')
      .where('subscription.paypalSubscriptionId', '==', subscriptionId)
      .get();

    if (usersSnapshot.empty) {
      console.log('⚠️ No user found with PayPal subscription ID:', subscriptionId);
      return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    // Calculate next billing date based on plan interval
    const now = new Date();
    const nextBilling = new Date(now);
    
    // For daily testing plans
    if (userData.subscription?.planId === 'premium' || userData.subscription?.planId === 'ultimate') {
      nextBilling.setDate(nextBilling.getDate() + 1);
    }

    // Reset credits based on plan
    let newCredits = 30; // free default
    if (userData.subscription?.planId === 'premium') {
      newCredits = 200;
    } else if (userData.subscription?.planId === 'ultimate') {
      newCredits = 500;
    }

    // Update user data
    await adminDb.collection('users').doc(userId).update({
      credits: newCredits,
      messagesLeft: newCredits,
      'subscription.lastChargedAt': now.toISOString(),
      'subscription.nextBillingDate': nextBilling.toISOString(),
      'subscription.status': 'active',
    });

    console.log('✅ Recurring payment processed for user:', userId, 'Credits reset to:', newCredits);
    
  } catch (error) {
    console.error('❌ Error processing payment completed:', error);
  }
}

async function handleSubscriptionActivated(webhookData: any) {
  try {
    console.log('🔄 Processing subscription activated');
    
    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return;
    }
    
    const subscriptionId = webhookData.resource?.id;
    if (!subscriptionId) return;

    // Find user and update status
    const usersSnapshot = await adminDb.collection('users')
      .where('subscription.paypalSubscriptionId', '==', subscriptionId)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      const now = new Date();
      
      await adminDb.collection('users').doc(userDoc.id).update({
        'subscription.status': 'active',
        'subscription.activatedAt': now.toISOString(),
      });
      console.log('✅ Subscription activated for user:', userDoc.id);
    }
    
  } catch (error) {
    console.error('❌ Error processing subscription activated:', error);
  }
}

async function handleSubscriptionCancelled(webhookData: any) {
  try {
    console.log('❌ Processing subscription cancelled');
    
    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return;
    }
    
    const subscriptionId = webhookData.resource?.id;
    if (!subscriptionId) return;

    // Find user and update status
    const usersSnapshot = await adminDb.collection('users')
      .where('subscription.paypalSubscriptionId', '==', subscriptionId)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await adminDb.collection('users').doc(userDoc.id).update({
        'subscription.status': 'cancelled',
        'subscription.cancelledAt': new Date().toISOString(),
        // Keep current credits until they run out
      });
      console.log('✅ Subscription cancelled for user:', userDoc.id);
    }
    
  } catch (error) {
    console.error('❌ Error processing subscription cancelled:', error);
  }
}

async function handleSubscriptionSuspended(webhookData: any) {
  try {
    console.log('⏸️ Processing subscription suspended');
    
    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return;
    }
    
    const subscriptionId = webhookData.resource?.id;
    if (!subscriptionId) return;

    // Find user and update status
    const usersSnapshot = await adminDb.collection('users')
      .where('subscription.id', '==', subscriptionId)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await adminDb.collection('users').doc(userDoc.id).update({
        'subscription.status': 'suspended',
        'subscription.suspendedAt': new Date().toISOString(),
      });
      console.log('✅ Subscription suspended for user:', userDoc.id);
    }
    
  } catch (error) {
    console.error('❌ Error processing subscription suspended:', error);
  }
}

async function handlePaymentFailed(webhookData: any) {
  try {
    console.log('⚠️ Processing payment failed');
    
    if (!adminDb) {
      console.error('❌ Firebase Admin DB not initialized');
      return;
    }
    
    const subscriptionId = webhookData.resource?.billing_agreement_id;
    if (!subscriptionId) return;

    // Find user and update status
    const usersSnapshot = await adminDb.collection('users')
      .where('subscription.id', '==', subscriptionId)
      .get();

    if (!usersSnapshot.empty) {
      const userDoc = usersSnapshot.docs[0];
      await adminDb.collection('users').doc(userDoc.id).update({
        'subscription.status': 'payment_failed',
        'subscription.lastFailedAt': new Date().toISOString(),
      });
      console.log('✅ Payment failure recorded for user:', userDoc.id);
    }
    
  } catch (error) {
    console.error('❌ Error processing payment failed:', error);
  }
}
