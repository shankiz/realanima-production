
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

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
    console.log('🔍 Getting existing PayPal subscription plan...');

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    if (!adminAuth) {
      console.error('❌ Firebase Admin not initialized');
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 500 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);

    const body = await request.json();
    const { planId, planName, price, credits } = body;

    if (!planId || !planName || !price || !credits) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('📋 Plan details:', { planId, planName, price, credits });

    // Import the SUBSCRIPTION_PLANS to get the existing PayPal plan ID
    const { SUBSCRIPTION_PLANS } = require('@/services/PayPalSubscriptionService');
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];

    if (!plan || !plan.paypalPlanId) {
      return NextResponse.json({ error: 'Invalid plan or PayPal plan ID not found' }, { status: 400 });
    }

    console.log('✅ Using existing PayPal plan:', plan.paypalPlanId);

    return NextResponse.json({ 
      paypalPlanId: plan.paypalPlanId,
      productId: 'existing' // Not needed since we're reusing plans
    });

  } catch (error: unknown) {
    console.error('Plan retrieval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
