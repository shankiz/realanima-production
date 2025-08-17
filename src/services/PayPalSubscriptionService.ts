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

// Debug: Log actual environment values to ensure we're reading the right ones
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
  console.log('🆔 PayPal Client ID exists:', !!PAYPAL_CLIENT_ID);
  console.log('🆔 PayPal Client ID length:', PAYPAL_CLIENT_ID ? PAYPAL_CLIENT_ID.length : 0);
  console.log('🆔 PayPal Client ID preview:', PAYPAL_CLIENT_ID ? `${PAYPAL_CLIENT_ID.substring(0, 10)}...` : 'MISSING');
  console.log('🔐 PayPal Client Secret exists:', !!PAYPAL_CLIENT_SECRET);
  console.log('🔐 PayPal Client Secret length:', PAYPAL_CLIENT_SECRET ? PAYPAL_CLIENT_SECRET.length : 0);
  console.log('🔐 PayPal Client Secret preview:', PAYPAL_CLIENT_SECRET ? `${PAYPAL_CLIENT_SECRET.substring(0, 10)}...` : 'MISSING');

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials are missing from environment variables');
  }

  // Create the basic auth string
  const credentials = `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');
  console.log('🔑 Basic auth string length:', encodedCredentials.length);
  console.log('🔑 Basic auth preview:', `${encodedCredentials.substring(0, 20)}...`);

  const requestBody = 'grant_type=client_credentials';
  console.log('📋 Request body:', requestBody);

  const headers = {
    'Authorization': `Basic ${encodedCredentials}`,
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept': 'application/json',
    'Accept-Language': 'en_US',
  };

  console.log('📋 Request headers:', Object.keys(headers));

  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: headers,
    body: requestBody,
  });

  console.log('📡 PayPal token response status:', response.status);
  console.log('📡 PayPal token response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ PayPal token request failed:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      requestUrl: `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      clientIdLength: PAYPAL_CLIENT_ID?.length,
      clientSecretLength: PAYPAL_CLIENT_SECRET?.length
    });
    throw new Error(`PayPal authentication failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ PayPal access token obtained successfully');
  return data.access_token;
}

export class PayPalSubscriptionService {
  async createVaultSetupToken(planId: string, returnUrl: string, cancelUrl: string) {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    const accessToken = await getPayPalAccessToken();

    // Use the correct PayPal v3 vault setup token format
    const setupTokenData = {
      payment_source: {
        paypal: {
          description: plan.description,
          usage_pattern: "IMMEDIATE",
          usage_type: "MERCHANT",
          customer_type: "CONSUMER",
          permit_multiple_payment_tokens: false,
          experience_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl,
            brand_name: "RealAnima AI",
            locale: "en-US",
            shipping_preference: "NO_SHIPPING",
            user_action: "CONTINUE"
          }
        }
      }
    };

    console.log('🔧 Creating vault setup token with data:', JSON.stringify(setupTokenData, null, 2));

    const response = await fetch(`${PAYPAL_BASE_URL}/v3/vault/setup-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': uuidv4(),
        'Prefer': 'return=representation',
        'Accept': 'application/json',
      },
      body: JSON.stringify(setupTokenData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('PayPal setup token creation error:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });
      throw new Error(`Failed to create vault setup token: ${result.message || result.error_description || 'Unknown error'}`);
    }

    console.log('✅ Vault setup token created successfully:', result);
    return result;
  }

  async createPaymentToken(setupTokenId: string) {
    const accessToken = await getPayPalAccessToken();

    const paymentTokenData = {
      payment_source: {
        token: {
          id: setupTokenId,
          type: "SETUP_TOKEN",
        },
      },
    };

    console.log('🔧 Creating payment token with data:', JSON.stringify(paymentTokenData, null, 2));

    const response = await fetch(`${PAYPAL_BASE_URL}/v3/vault/payment-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': uuidv4(),
        'Prefer': 'return=representation',
        'Accept': 'application/json',
      },
      body: JSON.stringify(paymentTokenData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('PayPal payment token creation error:', {
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
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    const accessToken = await getPayPalAccessToken();

    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: plan.price.toFixed(2),
          },
          description: plan.description,
        },
      ],
      payment_source: {
        paypal: {
          vault_id: paymentTokenId,
          stored_credential: {
            payment_initiator: "MERCHANT",
            usage: "SUBSEQUENT",
            usage_pattern: "RECURRING_POSTPAID",
          },
        },
      },
    };

    console.log('🔧 Creating subscription order with data:', JSON.stringify(orderData, null, 2));

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': uuidv4(),
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('PayPal order creation error:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });
      throw new Error(`Failed to create subscription order: ${result.message || result.error_description || 'Unknown error'}`);
    }

    console.log('✅ Subscription order created successfully:', result);
    return result;
  }

  async captureOrder(orderId: string) {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': uuidv4(),
      },
      body: JSON.stringify({}),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('PayPal order capture error:', {
        status: response.status,
        statusText: response.statusText,
        result: result
      });
      throw new Error(`Failed to capture order: ${result.message || result.error_description || 'Unknown error'}`);
    }

    console.log('✅ Order captured successfully:', result);
    return result;
  }

  async chargeRecurringSubscription(
    paymentTokenId: string,
    planId: string,
    subscriptionId: string
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      console.log(`💳 Charging recurring subscription ${subscriptionId} with vault token ${paymentTokenId}`);

      // Get plan details - using full monthly prices
      const plans: Record<string, { price: string; description: string }> = {
        premium: { price: '3.88', description: 'Premium Plan - Monthly Billing' },
        ultimate: { price: '6.88', description: 'Ultimate Plan - Monthly Billing' }
      };

      const plan = plans[planId];
      if (!plan) {
        throw new Error(`Invalid plan ID: ${planId}`);
      }

      const accessToken = await getPayPalAccessToken();

      // Use PayPal v3 vault API for recurring payments with stored payment token
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: plan.price
          },
          description: plan.description,
          custom_id: subscriptionId
        }],
        payment_source: {
          paypal: {
            vault_id: paymentTokenId,
            stored_credential: {
              payment_initiator: 'MERCHANT',
              payment_type: 'UNSCHEDULED',
              usage: 'SUBSEQUENT',
              previous_network_transaction_reference: {
                id: 'placeholder', // This should be the reference from the first transaction
                network: 'PAYPAL'
              }
            }
          }
        }
      };

      console.log('🛒 Creating vault-based recurring payment order:', JSON.stringify(orderData, null, 2));

      const orderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `vault-recurring-${subscriptionId}-${Date.now()}`
        },
        body: JSON.stringify(orderData)
      });

      console.log('📡 Vault order response status:', orderResponse.status);
      console.log('📡 Vault order response headers:', Object.fromEntries(orderResponse.headers.entries()));

      if (!orderResponse.ok) {
        const errorText = await orderResponse.text();
        console.error('❌ PayPal vault order creation failed:', {
          status: orderResponse.status,
          statusText: response.statusText,
          body: errorText
        });

        // Fallback: Try simpler approach without stored_credential details
        console.log('🔄 Trying simplified vault approach...');
        const simplifiedOrderData = {
          intent: 'CAPTURE',
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: plan.price
            },
            description: plan.description,
            custom_id: subscriptionId
          }],
          payment_source: {
            paypal: {
              vault_id: paymentTokenId
            }
          }
        };

        const fallbackResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'PayPal-Request-Id': `vault-simple-${subscriptionId}-${Date.now()}`
          },
          body: JSON.stringify(simplifiedOrderData)
        });

        console.log('📡 Fallback response status:', fallbackResponse.status);

        if (!fallbackResponse.ok) {
          const fallbackErrorText = await fallbackResponse.text();
          console.error('❌ PayPal fallback order creation failed:', {
            status: fallbackResponse.status,
            statusText: fallbackResponse.statusText,
            body: fallbackErrorText
          });
          throw new Error(`Order creation failed: ${fallbackResponse.status} - ${fallbackErrorText}`);
        }

        // Use fallback response
        const orderResult = await fallbackResponse.json();
        console.log('📦 Fallback order creation response:', orderResult);

        // Check if order is already completed (auto-captured)
        if (orderResult.status === 'COMPLETED') {
          console.log('✅ Fallback order was auto-captured by PayPal, no manual capture needed');
          return {
            success: true,
            orderId: orderResult.id
          };
        }

        // Capture the order manually if not auto-captured
        return await this.captureVaultOrder(orderResult.id, subscriptionId, accessToken);
      }

      const orderResult = await orderResponse.json();
      console.log('📦 Vault order creation response:', orderResult);

      // Check if order is already completed (auto-captured)
      if (orderResult.status === 'COMPLETED') {
        console.log('✅ Order was auto-captured by PayPal, no manual capture needed');
        return {
          success: true,
          orderId: orderResult.id
        };
      }

      // Capture the order manually if not auto-captured
      return await this.captureVaultOrder(orderResult.id, subscriptionId, accessToken);

    } catch (error) {
      console.error(`❌ Recurring billing failed for subscription ${subscriptionId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async captureVaultOrder(
    orderId: string,
    subscriptionId: string,
    accessToken: string
  ): Promise<{ success: boolean; orderId?: string; error?: string }> {
    const captureResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `vault-capture-${subscriptionId}-${Date.now()}`
      }
    });

    console.log('📡 Vault capture response status:', captureResponse.status);

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error('❌ PayPal vault order capture failed:', {
        status: captureResponse.status,
        statusText: captureResponse.statusText,
        body: errorText
      });
      throw new Error(`Payment capture failed: ${captureResponse.status} - ${errorText}`);
    }

    const captureResult = await captureResponse.json();
    console.log('💰 Vault capture response:', captureResult);

    if (captureResponse.ok && captureResult.status === 'COMPLETED') {
      console.log(`✅ Successfully charged vault-based recurring subscription ${subscriptionId}`);
      return {
        success: true,
        orderId: orderId
      };
    } else {
      throw new Error(`Payment capture failed: ${captureResult.message || 'Unknown error'}`);
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Implementation for canceling subscription
      return { success: true };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to cancel subscription' };
    }
  }
}