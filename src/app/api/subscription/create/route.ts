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
    const uid = decodedToken.uid;

    const body = await request.json();
    const { planId, planName, price, credits } = body;

    if (!planId || !planName || !price || !credits) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create billing plan
    const billingPlan = {
      product_id: `${planId}_product`,
      name: planName,
      description: `Daily subscription for ${planName}`,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: "DAY",
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

    // Create the billing plan
    const planResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `${planId}-${Date.now()}`,
      },
      body: JSON.stringify(billingPlan),
    });

    const planData = await planResponse.json();

    if (!planResponse.ok) {
      console.error('PayPal plan creation error:', planData);
      return NextResponse.json({ error: 'Failed to create billing plan' }, { status: 500 });
    }

    // Create subscription
    const subscription = {
      plan_id: planData.id,
      subscriber: {
        email_address: decodedToken.email || `user-${uid}@example.com`,
        name: {
          given_name: decodedToken.name || 'User',
          surname: 'Subscriber'
        }
      },
      application_context: {
        brand_name: "RealAnima AI",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        payment_method: {
          payer_selected: "PAYPAL",
          payee_preferred: "IMMEDIATE_PAYMENT_REQUIRED"
        },
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/cancel`
      }
    };

    const subscriptionResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `sub-${planId}-${Date.now()}`,
      },
      body: JSON.stringify(subscription),
    });

    const subscriptionData = await subscriptionResponse.json();

    if (!subscriptionResponse.ok) {
      console.error('PayPal subscription creation error:', subscriptionData);
      return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }

    return NextResponse.json({ 
      subscriptionId: subscriptionData.id,
      planId: planData.id,
      approvalUrl: subscriptionData.links.find((link: any) => link.rel === 'approve')?.href
    });

  } catch (error: unknown) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}