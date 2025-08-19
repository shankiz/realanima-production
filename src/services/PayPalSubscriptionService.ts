import { v4 as uuidv4 } from 'uuid';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  interval: 'DAY' | 'MONTH';
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free Plan',
    description: 'Free tier with 10 daily messages',
    price: 0.00,
    credits: 10,
    interval: 'DAY'
  },
  premium: {
    id: 'premium',
    name: 'Premium Plan',
    description: 'Premium subscription with 200 daily messages',
    price: 3.88,
    credits: 200,
    interval: 'MONTH'
  },
  ultimate: {
    id: 'ultimate',
    name: 'Ultimate Plan',
    description: 'Ultimate subscription with 500 daily messages',
    price: 6.88,
    credits: 500,
    interval: 'MONTH'
  }
};

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

console.log('🔍 Environment variable check:');
console.log('PAYPAL_CLIENT_ID from env:', process.env.PAYPAL_CLIENT_ID ? `${process.env.PAYPAL_CLIENT_ID.substring(0, 10)}...` : 'MISSING');
console.log('PAYPAL_CLIENT_SECRET from env:', process.env.PAYPAL_CLIENT_SECRET ? `${process.env.PAYPAL_CLIENT_SECRET.substring(0, 10)}...` : 'MISSING');

const PAYPAL_BASE_URL = PAYPAL_MODE === 'live' 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com';

async function getPayPalAccessToken() {
  console.log('🔑 Getting PayPal access token...');
  console.log('🌐 PayPal Base URL:', PAYPAL_BASE_URL);
  console.log('🌐 PayPal Mode:', PAYPAL_MODE);

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials are missing from environment variables');
  }

  const credentials = `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${encodedCredentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
    },
    body: 'grant_type=client_credentials',
  });

  console.log('📡 PayPal token response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ PayPal token request failed:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    throw new Error(`PayPal authentication failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ PayPal access token obtained successfully');
  return data.access_token;
}

export class PayPalSubscriptionService {
  async createPaymentToken(setupTokenId: string) {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/vault/payment-tokens`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': uuidv4(),
      },
      body: JSON.stringify({
        payment_source: {
          token: {
            id: setupTokenId,
            type: 'SETUP_TOKEN'
          }
        }
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('PayPal create payment token error:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });
      throw new Error(`Failed to create payment token: ${result.message || result.error_description || 'Unknown error'}`);
    }

    console.log('✅ Payment token created successfully:', result);
    return result;
  }

  async createSubscriptionOrder(paymentTokenId: string, planId: string) {
    const accessToken = await getPayPalAccessToken();
    const plan = SUBSCRIPTION_PLANS[planId];

    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: plan.price.toFixed(2)
        },
        description: `${plan.name} - ${plan.description}`
      }],
      payment_source: {
        token: {
          id: paymentTokenId,
          type: 'PAYMENT_TOKEN'
        }
      }
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
      console.error('PayPal subscription details error:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });
      throw new Error(`Failed to get subscription details: ${result.message || result.error_description || 'Unknown error'}`);
    }

    console.log('✅ Subscription details retrieved successfully:', result);
    return result;
  }

  async cancelSubscription(subscriptionId: string, reason: string = 'User requested cancellation'): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await getPayPalAccessToken();

      const cancelData = {
        reason: reason
      };

      const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': uuidv4(),
        },
        body: JSON.stringify(cancelData),
      });

      console.log('📡 Cancel subscription response status:', response.status);

      if (response.status === 204) {
        // 204 No Content is the expected successful response for cancellation
        console.log('✅ Subscription cancelled successfully');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ PayPal subscription cancellation failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return { success: false, error: `Cancellation failed: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel subscription' };
    }
  }

  async suspendSubscription(subscriptionId: string, reason: string = 'Payment failure'): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await getPayPalAccessToken();

      const suspendData = {
        reason: reason
      };

      const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/suspend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': uuidv4(),
        },
        body: JSON.stringify(suspendData),
      });

      console.log('📡 Suspend subscription response status:', response.status);

      if (response.status === 204) {
        console.log('✅ Subscription suspended successfully');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ PayPal subscription suspension failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return { success: false, error: `Suspension failed: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      console.error('Error suspending subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to suspend subscription' };
    }
  }

  async activateSubscription(subscriptionId: string, reason: string = 'Reactivating subscription'): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await getPayPalAccessToken();

      const activateData = {
        reason: reason
      };

      const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': uuidv4(),
        },
        body: JSON.stringify(activateData),
      });

      console.log('📡 Activate subscription response status:', response.status);

      if (response.status === 204) {
        console.log('✅ Subscription activated successfully');
        return { success: true };
      } else {
        const errorText = await response.text();
        console.error('❌ PayPal subscription activation failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return { success: false, error: `Activation failed: ${response.status} - ${errorText}` };
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to activate subscription' };
    }
  }
}