
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_BASE_URL = PAYPAL_MODE === 'live' 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com';

async function getPayPalAccessToken() {
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    if (!adminAuth || !adminDb) {
      console.error('❌ Firebase Admin not initialized');
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 500 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const body = await request.json();
    const { subscriptionId, planId } = body;

    if (!subscriptionId || !planId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log(`🔍 Processing subscription approval for user ${uid}, subscription ${subscriptionId}, plan ${planId}`);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get subscription details from PayPal
    const subscriptionResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const subscriptionData = await subscriptionResponse.json();

    if (!subscriptionResponse.ok) {
      console.error('❌ Failed to get subscription details:', subscriptionData);
      return NextResponse.json({ error: 'Failed to verify subscription' }, { status: 400 });
    }

    console.log('📋 Subscription details:', {
      id: subscriptionData.id,
      status: subscriptionData.status,
      plan_id: subscriptionData.plan_id
    });

    // Verify subscription is active
    if (subscriptionData.status !== 'ACTIVE') {
      console.error('❌ Subscription is not active:', subscriptionData.status);
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
    }

    // Get plan details for credits
    const planCredits = {
      premium: 200,
      ultimate: 500
    };

    const credits = planCredits[planId as keyof typeof planCredits] || 0;

    // Get billing frequency from PayPal subscription details
    const billingFrequency = subscriptionData.billing_info?.cycle_executions?.[0]?.frequency || { interval_unit: 'DAY', interval_count: 1 };
    
    // Calculate next billing date based on actual frequency
    const nextBillingDate = new Date();
    if (billingFrequency.interval_unit === 'DAY') {
      nextBillingDate.setDate(nextBillingDate.getDate() + (billingFrequency.interval_count || 1));
    } else if (billingFrequency.interval_unit === 'MONTH') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + (billingFrequency.interval_count || 1));
    } else if (billingFrequency.interval_unit === 'YEAR') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + (billingFrequency.interval_count || 1));
    } else {
      // Default to monthly for production
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    // Update user in Firestore
    const userRef = adminDb.collection('users').doc(uid);
    
    await userRef.update({
      subscriptionPlan: planId,
      subscriptionStatus: 'active',
      paypalSubscriptionId: subscriptionId,
      paypalPlanId: subscriptionData.plan_id,
      dailyMessages: credits,
      maxDailyMessages: credits,
      subscriptionStartDate: new Date().toISOString(),
      nextBillingDate: nextBillingDate.toISOString(),
      lastPaymentDate: new Date().toISOString(),
      paymentMethod: 'paypal_traditional',
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Updated user ${uid} with traditional subscription ${subscriptionId}`);

    return NextResponse.json({ 
      success: true,
      subscriptionId: subscriptionId,
      status: 'active',
      credits: credits
    });

  } catch (error: unknown) {
    console.error('❌ Subscription approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
