import { v4 as uuidv4 } from 'uuid';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_DEBUG = process.env.PAYPAL_DEBUG === 'true';

const PAYPAL_BASE_URL = PAYPAL_MODE === 'live'
  ? 'https://api.paypal.com'
  : 'https://api.sandbox.paypal.com';

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  premium: {
    name: 'Premium Daily (Testing)',
    price: 3.88, // Keep original price for testing
    credits: 200,
    interval: 'DAY',
    intervalCount: 1
  },
  ultimate: {
    name: 'Ultimate Daily (Testing)',
    price: 6.88, // Keep original price for testing
    credits: 500,
    interval: 'DAY',
    intervalCount: 1
  }
};

async function getPayPalAccessToken() {
  if (PAYPAL_DEBUG) {
    console.log('🔑 Getting PayPal access token...');
  }

  // Check for credentials when actually needed
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || PAYPAL_CLIENT_SECRET === 'your_paypal_client_secret_here') {
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
  async createActualSubscription(planId: keyof typeof SUBSCRIPTION_PLANS, subscriberInfo: any) {
    const accessToken = await getPayPalAccessToken();
    const plan = SUBSCRIPTION_PLANS[planId];

    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // First, create a product
    const productData = {
      name: `${plan.name} Product`,
      type: 'SERVICE',
      category: 'SOFTWARE'
    };

    const productResponse = await fetch(`${PAYPAL_BASE_URL}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': uuidv4(),
      },
      body: JSON.stringify(productData),
    });

    const product = await productResponse.json();
    if (!productResponse.ok) {
      throw new Error(`Failed to create product: ${product.message}`);
    }

    // Create a billing plan
    const billingPlanData = {
      product_id: product.id,
      name: plan.name,
      description: `${plan.credits} credits per ${plan.interval.toLowerCase()}`,
      status: 'ACTIVE',
      billing_cycles: [{
        frequency: {
          interval_unit: plan.interval,
          interval_count: plan.intervalCount
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // Infinite
        pricing_scheme: {
          fixed_price: {
            value: plan.price.toString(),
            currency_code: 'USD'
          }
        }
      }],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: 'USD'
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    };

    const planResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': uuidv4(),
      },
      body: JSON.stringify(billingPlanData),
    });

    const billingPlan = await planResponse.json();
    if (!planResponse.ok) {
      throw new Error(`Failed to create billing plan: ${billingPlan.message}`);
    }

    // Create the actual subscription
    const subscriptionData = {
      plan_id: billingPlan.id,
      subscriber: subscriberInfo,
      application_context: {
        brand_name: 'RealAnima AI',
        shipping_preference: 'NO_SHIPPING',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/subscription/cancel`
      }
    };

    const subscriptionResponse = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': uuidv4(),
      },
      body: JSON.stringify(subscriptionData),
    });

    const subscription = await subscriptionResponse.json();
    if (!subscriptionResponse.ok) {
      throw new Error(`Failed to create subscription: ${subscription.message}`);
    }

    console.log('✅ Real PayPal subscription created:', subscription);
    return subscription;
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