import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
// import { getUserDataAdmin } from '@/lib/firebase/admin-helpers';

// Real PayPal API integration
class PayPalSubscriptionService {
  private async getPayPalAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
    const isProduction = process.env.PAYPAL_MODE === 'production';
    const baseURL = isProduction ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const data = await response.json();
    return data.access_token;
  }

  async getSubscriptionDetails(subscriptionId: string) {
    try {
      console.log(`📞 Fetching real PayPal subscription details for: ${subscriptionId}`);
      const accessToken = await this.getPayPalAccessToken();
      const isProduction = process.env.PAYPAL_MODE === 'production';
      const baseURL = isProduction ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

      const response = await fetch(`${baseURL}/v1/billing/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error(`❌ PayPal API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const subscriptionData = await response.json();
      console.log('📊 Real PayPal subscription data received:', {
        status: subscriptionData.status,
        next_billing_time: subscriptionData.billing_info?.next_billing_time,
        last_payment_time: subscriptionData.billing_info?.last_payment?.time
      });

      return {
        status: subscriptionData.status,
        planId: subscriptionData.plan_id,
        billing_info: {
          next_billing_time: subscriptionData.billing_info?.next_billing_time,
          last_payment: subscriptionData.billing_info?.last_payment
        }
      };
    } catch (error) {
      console.error('❌ Error fetching PayPal subscription details:', error);
      return null;
    }
  }
}


export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user's subscription data with freshest possible data
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const subscriptionData = userData?.subscription; // Renamed for clarity

    console.log('📊 Fetching subscription status for user:', uid);
    console.log('📊 Current subscription data:', subscriptionData);

    console.log('📊 User data for subscription status:', {
      uid,
      currentPlan: userData?.currentPlan,
      credits: userData?.credits,
      hasPayerInfo: !!userData?.payerInfo,
      payerInfo: userData?.payerInfo,
      hasSubscription: !!subscriptionData,
      subscription: subscriptionData
    });

    // For users with premium/ultimate plans but missing subscription data, create and save a basic structure
    const shouldHaveSubscription = userData?.currentPlan && userData?.currentPlan !== 'free';
    let finalSubscription = subscriptionData;

    if (shouldHaveSubscription && !subscriptionData) {
      console.log('⚠️ User has premium plan but missing subscription data, creating and saving basic structure');
      finalSubscription = {
        status: 'active',
        planId: userData.currentPlan,
        subscriptionId: `legacy-${uid}-${userData.currentPlan}`,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        createdAt: userData.lastUpdated || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save the subscription data to the database
      await userRef.update({
        subscription: finalSubscription,
        lastUpdated: new Date().toISOString(),
      });

      console.log(`✅ Created subscription data for user ${uid} with plan ${userData.currentPlan}`);
    }

    // If subscription data exists, fetch real-time details from PayPal
    if (finalSubscription && finalSubscription.subscriptionId) {
      try {
        console.log('🔄 Fetching real-time PayPal data for subscription:', finalSubscription.subscriptionId);
        const paypalService = new PayPalSubscriptionService();
        const paypalDetails = await paypalService.getSubscriptionDetails(finalSubscription.subscriptionId);

        if (paypalDetails) {
          // For daily subscriptions, calculate proper next billing
          const now = new Date();
          let calculatedNextBilling = finalSubscription.nextBillingDate;

          // If we're past the billing date, calculate new one
          if (finalSubscription.nextBillingDate && new Date(finalSubscription.nextBillingDate) <= now) {
            const newNextBilling = new Date(now);
            newNextBilling.setDate(newNextBilling.getDate() + 1);
            calculatedNextBilling = newNextBilling.toISOString();

            console.log('📅 Calculated new next billing date:', calculatedNextBilling);
          }

          // Update our local data with fresh PayPal data
          const paypalNextBilling = paypalDetails.billing_info?.next_billing_time;
          const paypalLastPayment = paypalDetails.billing_info?.last_payment?.time;

          const updates: any = {
            'subscription.status': paypalDetails.status?.toLowerCase() || finalSubscription.status
          };

          if (paypalNextBilling) {
            updates['subscription.nextBillingDate'] = paypalNextBilling;
          } else if (calculatedNextBilling !== finalSubscription.nextBillingDate) {
            updates['subscription.nextBillingDate'] = calculatedNextBilling;
          }

          if (paypalLastPayment) {
            updates['subscription.lastChargedAt'] = paypalLastPayment;
          }

          if (Object.keys(updates).length > 1) {
            await adminDb.collection('users').doc(uid).update(updates);
          }

          finalSubscription = {
            ...finalSubscription,
            nextBillingDate: updates['subscription.nextBillingDate'] || finalSubscription.nextBillingDate,
            lastChargedAt: updates['subscription.lastChargedAt'] || finalSubscription.lastChargedAt,
            status: updates['subscription.status'] || finalSubscription.status
          };

          console.log('✅ Updated subscription with PayPal data:', {
            nextBillingDate: finalSubscription.nextBillingDate,
            lastChargedAt: finalSubscription.lastChargedAt,
            status: finalSubscription.status,
            paypalStatus: paypalDetails.status
          });
        } else {
          console.log('⚠️ Could not fetch PayPal details, using cached data');
        }
      } catch (error) {
        console.error('❌ Error fetching PayPal subscription details:', error);
        // Continue with cached data if PayPal API fails
      }
    }


    return NextResponse.json({
      currentPlan: userData?.currentPlan || 'free',
      credits: userData?.credits || 0,
      subscription: finalSubscription ? {
        status: finalSubscription.status,
        planId: finalSubscription.planId,
        subscriptionId: finalSubscription.subscriptionId || finalSubscription.id, // Ensure subscriptionId is present
        nextBillingDate: finalSubscription.nextBillingDate,
        lastChargedAt: finalSubscription.createdAt || finalSubscription.lastChargedAt,
        cancelledAt: finalSubscription.cancelledAt,
        cancelReason: finalSubscription.cancelReason,
      } : null
    });

  } catch (error) {
    console.error('❌ Get subscription status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}