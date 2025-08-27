
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
    console.log('🚀 Creating PayPal subscription plan...');
    console.log('🔧 PayPal Mode:', PAYPAL_MODE);
    console.log('🌐 PayPal Base URL:', PAYPAL_BASE_URL);

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

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    console.log('✅ Got PayPal access token');

    // First create a product
    const product = {
      name: `${planName} Product`,
      description: `Product for ${planName}`,
      type: "SERVICE",
      category: "SOFTWARE"
    };

    console.log('🛍️ Creating product:', product);

    const productResponse = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `product-${planId}-${Date.now()}`,
      },
      body: JSON.stringify(product),
    });

    const productData = await productResponse.json();

    if (!productResponse.ok) {
      console.error('❌ PayPal product creation error:', {
        status: productResponse.status,
        statusText: productResponse.statusText,
        data: productData
      });
      return NextResponse.json({ 
        error: 'Failed to create product', 
        details: productData 
      }, { status: 500 });
    }

    console.log('✅ Product created:', productData.id);

    // Create billing plan
    const billingPlan = {
      product_id: productData.id,
      name: planName,
      description: `Monthly subscription for ${planName}`,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "MONTH",
            interval_count: 1
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 means infinite
          pricing_scheme: {
            fixed_price: {
              value: price.toString(),
              currency_code: "USD"
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0",
          currency_code: "USD"
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3
      }
    };

    console.log('📅 Creating billing plan:', JSON.stringify(billingPlan, null, 2));

    // Create the billing plan
    const planResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `plan-${planId}-${Date.now()}`,
      },
      body: JSON.stringify(billingPlan),
    });

    const planData = await planResponse.json();

    if (!planResponse.ok) {
      console.error('❌ PayPal plan creation error:', {
        status: planResponse.status,
        statusText: planResponse.statusText,
        data: planData
      });
      return NextResponse.json({ 
        error: 'Failed to create billing plan', 
        details: planData 
      }, { status: 500 });
    }

    console.log('✅ PayPal plan created successfully:', planData.id);

    return NextResponse.json({ 
      paypalPlanId: planData.id,
      productId: productData.id
    });

  } catch (error: unknown) {
    console.error('Plan creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
