import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_BASE_URL = PAYPAL_MODE === 'sandbox' 
  ? 'https://api-m.sandbox.paypal.com' 
  : 'https://api-m.paypal.com';

console.log('🌍 PayPal Environment:', PAYPAL_MODE);
console.log('🔗 PayPal Base URL:', PAYPAL_BASE_URL);

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

export async function POST(request: NextRequest) {
  try {
    console.log('💳 Starting payment completion...');

    // Verify Firebase token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No authorization header found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decodedToken;

    try {
      decodedToken = await adminAuth.verifyIdToken(token);
      console.log('✅ Token verified for user:', decodedToken.uid);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      return NextResponse.json({ error: 'Authorization failed' }, { status: 401 });
    }

    const { orderID } = await request.json();
    console.log('🔍 Processing order:', orderID);

    if (!orderID) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get order from Firestore
    const orderDoc = await adminDb.collection('orders').doc(orderID).get();

    if (!orderDoc.exists) {
      console.log('❌ Order not found in database:', orderID);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const orderData = orderDoc.data();
    console.log('📊 Order data:', orderData);

    // Verify the order belongs to the authenticated user
    if (orderData?.userId !== decodedToken.uid) {
      console.log('❌ Order does not belong to user');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get PayPal access token
    console.log('🔑 Getting PayPal access token...');
    console.log('🔍 Client ID:', PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...` : 'MISSING');
    console.log('🔍 Client Secret:', PAYPAL_CLIENT_SECRET ? 'Present' : 'MISSING');
    
    const accessToken = await getPayPalAccessToken();
    console.log('✅ Access token obtained:', accessToken ? `${accessToken.substring(0, 20)}...` : 'MISSING');

    // Capture the PayPal order
    console.log('🏦 Capturing PayPal order...');
    console.log('🔑 Using access token:', accessToken ? 'Present' : 'Missing');
    console.log('🌐 PayPal Base URL:', PAYPAL_BASE_URL);
    console.log('📋 Order ID to capture:', orderID);

    const captureUrl = `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}/capture`;
    console.log('🎯 Capture URL:', captureUrl);

    const response = await fetch(captureUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `capture-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({})
    });

    const captureData = await response.json();
    console.log('📋 PayPal capture response:', JSON.stringify(captureData, null, 2));
    console.log('🔢 Response status:', response.status);
    console.log('✅ Response OK:', response.ok);

    if (!response.ok) {
      console.error('❌ PayPal API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: captureData,
        url: captureUrl,
        environment: PAYPAL_MODE
      });
      
      // Handle specific 403 errors
      if (response.status === 403) {
        console.error('🚫 403 Forbidden - Possible causes:');
        console.error('   - Using wrong environment (sandbox vs live)');
        console.error('   - Invalid or expired access token');
        console.error('   - Account not verified');
        console.error('   - Missing permissions');
        
        return NextResponse.json({ 
          error: 'Payment authorization failed', 
          details: 'Please check PayPal account permissions and environment settings',
          paypalError: captureData
        }, { status: 403 });
      }
      
      throw new Error(`PayPal API Error: ${captureData.message || captureData.error || 'Unknown error'}`);
    }

    if (captureData.status === 'COMPLETED') {
      console.log('✅ Payment completed successfully');

      // Add credits immediately to user account
      const userRef = adminDb.collection('users').doc(decodedToken.uid);
      const userDoc = await userRef.get();

      let currentCredits = 0;
      if (userDoc.exists) {
        const userData = userDoc.data();
        currentCredits = userData?.credits || 0;
      }

      const newCredits = currentCredits + orderData.credits;
      console.log(`💰 Adding ${orderData.credits} credits to user. Current: ${currentCredits}, New total: ${newCredits}`);

      // Update user credits immediately
      await userRef.set({
        credits: newCredits,
        messagesLeft: newCredits,
        updatedAt: new Date()
      }, { merge: true });

      // Update order status to completed
      await adminDb.collection('orders').doc(orderID).update({
        status: 'completed',
        paypalCaptureId: captureData.id,
        capturedAt: new Date(),
        completedAt: new Date()
      });

      console.log('✅ Credits added immediately and order completed');

      return NextResponse.json({ 
        status: 'COMPLETED',
        id: captureData.id,
        creditsAdded: orderData.credits,
        newTotal: newCredits,
        message: 'Payment completed and credits added successfully'
      });
    } else {
      console.log('❌ Payment capture failed:', captureData);
      return NextResponse.json(captureData, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Error completing payment:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}