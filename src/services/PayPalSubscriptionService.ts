import { v4 as uuidv4 } from 'uuid';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_DEBUG = process.env.PAYPAL_DEBUG === 'true';

const PAYPAL_BASE_URL = PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

// Subscription plans configuration with reusable PayPal plan IDs
export const SUBSCRIPTION_PLANS = {
  premium: {
    name: 'Premium Monthly',
    price: 3.88, // Your original monthly price
    credits: 200,
    interval: 'MONTH',
    intervalCount: 1,
    paypalPlanId: 'REPLACE_WITH_NEW_PREMIUM_PLAN_ID' // Will be updated with fresh Premium plan
  },
  ultimate: {
    name: 'Ultimate Monthly',
    price: 6.88, // Your original monthly price
    credits: 500,
    interval: 'MONTH',
    intervalCount: 1,
    paypalPlanId: 'P-0B523244UM225325KNCXTGTQ' // Reuse existing Ultimate plan
  }
};

async function getPayPalAccessToken() {
  if (PAYPAL_DEBUG) {
    console.log('🔑 Getting PayPal access token...');
    console.log('🔧 PayPal Mode:', PAYPAL_MODE);
    console.log('🌐 PayPal Base URL:', PAYPAL_BASE_URL);
  }

  // Check for credentials when actually needed
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || PAYPAL_CLIENT_SECRET === 'your_paypal_client_secret_here') {
    console.error('❌ PayPal credentials missing or invalid:', {
      hasClientId: !!PAYPAL_CLIENT_ID,
      hasClientSecret: !!PAYPAL_CLIENT_SECRET,
      clientSecretIsPlaceholder: PAYPAL_CLIENT_SECRET === 'your_paypal_client_secret_here'
    });
    throw new Error('PayPal credentials not found in environment variables');
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('PayPal access token error:', data);
    throw new Error(`Failed to get PayPal access token: ${data.error_description || data.error}`);
  }

  if (PAYPAL_DEBUG) {
    console.log('✅ PayPal access token obtained');
  }

  return data.access_token;
}

export class PayPalSubscriptionService {
  async createSubscriptionOrder(paymentSourceToken: string, planId: keyof typeof SUBSCRIPTION_PLANS) {
    const accessToken = await getPayPalAccessToken();
    const plan = SUBSCRIPTION_PLANS[planId];

    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    const orderData = {
      intent: 'CAPTURE',
      payment_source: {
        token: {
          id: paymentSourceToken,
          type: 'BILLING_AGREEMENT'
        }
      },
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: plan.price.toString()
        },
        description: `${plan.name} Subscription - ${plan.credits} credits`
      }]
    };

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': uuidv4(),
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('PayPal create order error:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });
      throw new Error(`Failed to create order: ${result.message || result.error_description || 'Unknown error'}`);
    }

    console.log('✅ Order created successfully:', result);
    return result;
  }

  async captureOrder(orderId: string) {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': uuidv4(),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('PayPal capture order error:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });
      throw new Error(`Failed to capture order: ${result.message || result.error_description || 'Unknown error'}`);
    }

    console.log('✅ Order captured successfully:', result);
    return result;
  }

  async getSubscriptionDetails(subscriptionId: string) {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('PayPal get subscription details error:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });
      throw new Error(`Failed to get subscription details: ${result.message || result.error_description || 'Unknown error'}`);
    }

    console.log('✅ Subscription details retrieved:', result);
    return result;
  }

  async cancelSubscription(subscriptionId: string, reason: string) {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': uuidv4(),
      },
      body: JSON.stringify({
        reason: reason || 'User requested cancellation'
      }),
    });

    if (!response.ok) {
      const result = await response.json();
      console.error('PayPal cancel subscription error:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });
      return {
        success: false,
        error: `Failed to cancel subscription: ${result.message || result.error_description || 'Unknown error'}`
      };
    }

    console.log('✅ Subscription cancelled successfully on PayPal');
    return { success: true };
  }
}