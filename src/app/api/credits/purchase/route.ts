
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_BASE_URL = PAYPAL_MODE === 'sandbox' 
  ? 'https://api-m.sandbox.paypal.com' 
  : 'https://api-m.paypal.com';

console.log('🌍 PayPal Environment:', PAYPAL_MODE);

// Get PayPal access token
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('PayPal access token error:', error);
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Package configurations
const PACKAGES = {
  small: { credits: 500, amount: 3.00, description: '500 message credits' },
  medium: { credits: 1200, amount: 6.00, description: '1200 message credits' },
  large: { credits: 2500, amount: 8.00, description: '2500 message credits' }
};

export async function POST(request: NextRequest) {
  try {
    console.log('🛒 Starting PayPal order creation...');

    // Verify Firebase token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    console.log('✅ Token verified for user:', decodedToken.uid);

    const { package: packageType } = await request.json();
    console.log('📦 Package type:', packageType);

    if (!packageType || !PACKAGES[packageType as keyof typeof PACKAGES]) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const packageConfig = PACKAGES[packageType as keyof typeof PACKAGES];
    console.log('💰 Package config:', packageConfig);

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order following the exact format from PayPal docs
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: packageConfig.amount.toFixed(2)
          }
        }
      ]
    };

    console.log('🏦 Creating PayPal order with data:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orderData),
    });

    const order = await response.json();
    console.log('📋 PayPal order response:', order);

    if (!response.ok) {
      console.error('❌ PayPal order creation failed:', order);
      return NextResponse.json({ 
        error: order.message || 'Failed to create PayPal order',
        details: order.details 
      }, { status: 400 });
    }

    // Store order in Firestore
    const orderRecord = {
      userId: decodedToken.uid,
      orderId: order.id,
      packageType,
      credits: packageConfig.credits,
      amount: packageConfig.amount,
      status: 'created',
      createdAt: new Date(),
    };

    await adminDb.collection('orders').doc(order.id).set(orderRecord);
    console.log('💾 Order saved to Firestore:', orderRecord);

    // Return the order ID for PayPal to process
    return NextResponse.json({ id: order.id });

  } catch (error) {
    console.error('❌ Error creating PayPal order:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
