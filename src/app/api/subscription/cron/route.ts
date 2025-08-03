import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Verify this is coming from a legitimate cron service
    // const authHeader = request.headers.get('authorization');
    // const cronSecret = process.env.CRON_SECRET;

    // TODO: Re-enable auth in production
    // if (authHeader !== `Bearer ${cronSecret}`) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    console.log('🕐 Cron job triggered - processing recurring billing');
    console.log('⏰ Timestamp:', new Date().toISOString());

    // Import and call the recurring billing processor directly
    const { processRecurringBilling } = await import('../process-recurring/route');

    // Call the function directly instead of making HTTP request
    const mockRequest = new Request('http://localhost/api/subscription/process-recurring', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const billingResponse = await processRecurringBilling(mockRequest);
    const result = await billingResponse.json();

    if (billingResponse.ok) {
      console.log('✅ Billing processing completed');
      console.log(`📊 Billing Summary: ${result.processed || 0} operations processed`);

      // Import and call the active subscriptions function directly
      const { GET: getActiveSubscriptions } = await import('./active-subscriptions/route');
      const mockActiveRequest = new Request('http://localhost/api/subscription/cron/active-subscriptions', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const activeSubsResponse = await getActiveSubscriptions(mockActiveRequest as any);
      let activeSubscriptions = [];
      let summary = {};

      if (activeSubsResponse.ok) {
        const activeData = await activeSubsResponse.json();
        activeSubscriptions = activeData.activeSubscriptions || [];
        summary = activeData.summary || {};

        console.log('📈 Subscription Summary:');
        console.log(`   Total Active: ${activeSubscriptions.length}`);
        console.log(`   Premium Users: ${summary.premiumUsers || 0}`);
        console.log(`   Ultimate Users: ${summary.ultimateUsers || 0}`);
        console.log(`   Cancelled (but active): ${summary.cancelledButActive || 0}`);
      } else {
        console.log('❌ Failed to fetch active subscriptions:', activeSubsResponse.status);
      }

      const responseData = {
        success: true,
        timestamp: new Date().toISOString(),
        message: '✅ Recurring billing processed successfully',

        billing: {
          processed: result.processed || 0,
          results: result.results || [],
          summary: `Processed ${result.processed || 0} billing operations`
        },

        subscriptions: {
          summary: {
            totalSubscriptions: summary.totalSubscriptions || 0,
            activeSubscriptions: summary.activeSubscriptions || 0,
            cancelledButActive: summary.cancelledButActive || 0,
            premiumUsers: summary.premiumUsers || 0,
            ultimateUsers: summary.ultimateUsers || 0
          },

          details: activeSubscriptions.map(sub => ({
            userId: sub.userId,
            email: sub.email,
            plan: sub.currentPlan,
            status: sub.status,
            credits: sub.credits,
            billingInfo: {
              nextBilling: sub.nextBillingDate,
              daysUntilEnd: sub.daysUntilEnd || null,
              daysSinceCreated: sub.daysSinceCreated || null
            },
            ...(sub.status === 'cancelled' && {
              cancellation: {
                cancelledAt: sub.cancelledAt,
                reason: sub.cancelReason
              }
            })
          }))
        }
      };

      return new Response(JSON.stringify(responseData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.error('❌ Cron job failed:', result);
      return NextResponse.json(
        { error: 'Failed to process recurring billing' },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error('💥 Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}