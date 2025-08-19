'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface BillingSectionProps {
  user: any;
  currentUserPlan: string;
  onPlanChange: () => void;
}

interface SubscriptionData {
  currentPlan: string;
  credits: number;
  subscription: {
    status: string;
    planId: string;
    nextBillingDate: string;
    lastChargedAt?: string;
    cancelledAt?: string;
    cancelReason?: string;
  } | null;
}

const BillingSection: React.FC<BillingSectionProps> = ({ user, currentUserPlan, onPlanChange }) => {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  const fetchSubscriptionData = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/subscription/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Subscription data received:', data);

        // If user has premium plan but no subscription data, try to migrate
        if ((currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && !data.subscription) {
          console.log('🔄 Attempting to migrate user data...');
          const migrateResponse = await fetch('/api/subscription/migrate', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (migrateResponse.ok) {
            // Refetch data after migration
            return fetchSubscriptionData();
          }
        }

        setSubscriptionData(data);
      } else {
        console.error('Failed to fetch subscription data');
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user]);

  const handleCancelSubscription = async () => {
    if (!user || !subscriptionData?.subscription) {
      alert('No active subscription found to cancel.');
      return;
    }

    // Confirm cancellation
    const confirmed = window.confirm(
      'Are you sure you want to cancel your subscription? You will retain access until your next billing date.'
    );

    if (!confirmed) return;

    setCancelling(true);
    try {
      const token = await user.getIdToken();
      console.log('🚫 Attempting to cancel subscription...');

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('📊 Cancel response:', result);

      if (response.ok && result.success) {
        const accessDate = result.accessUntil !== 'immediately' 
          ? new Date(result.accessUntil).toLocaleDateString()
          : 'immediately';

        alert(`✅ Subscription cancelled successfully! You'll retain access until ${accessDate}`);

        // Refresh subscription data
        await fetchSubscriptionData();
        onPlanChange();
      } else {
        console.error('❌ Cancel failed:', result);
        alert(`Failed to cancel subscription: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
        <span className="ml-3 text-gray-400">Loading billing info...</span>
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">Unable to load billing information</p>
        <Button 
          onClick={fetchSubscriptionData}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Retry
        </Button>
      </div>
    );
  }

  const { subscription } = subscriptionData;

  return (
    <div className="space-y-4">
      {/* Current Plan Info */}
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-white">Current Plan</h4>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            currentUserPlan === 'premium' 
              ? 'bg-purple-900/30 text-purple-400' 
              : currentUserPlan === 'ultimate'
              ? 'bg-amber-900/30 text-amber-400'
              : 'bg-gray-900/30 text-gray-400'
          }`}>
            {currentUserPlan?.toUpperCase() || 'FREE'}
          </div>
        </div>

        <div className="text-sm text-gray-400 space-y-1">
          <p>Credits: {subscriptionData.credits || 0}</p>

          {/* Show subscription details if user has premium/ultimate plan */}
          {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && subscription && (
            <>
              <p>Status: <span className={`${
            subscription.cancelledAt || subscription.status === 'cancelled' 
              ? 'text-yellow-400' 
              : subscription.status === 'active' 
              ? 'text-green-400' 
              : 'text-red-400'
          }`}>
            {subscription.cancelledAt || subscription.status === 'cancelled'
              ? 'Cancelled (Access until end date)' 
              : subscription.status?.charAt(0).toUpperCase() + subscription.status?.slice(1)}
          </span></p>

              {subscription.nextBillingDate && (
            <p>
              {subscription.status === 'cancelled' || subscription.cancelledAt ? 'Access until:' : 'Next billing:'} {formatDate(subscription.nextBillingDate)}
            </p>
          )}

              {subscription.lastChargedAt && (
                <p>Last charged: {formatDate(subscription.lastChargedAt)}</p>
              )}

              {subscription.cancelledAt && (
                <p>Cancelled on: {formatDate(subscription.cancelledAt)}</p>
              )}
            </>
          )}

          {/* Show billing info even for free users */}
          {currentUserPlan === 'free' && (
            <div className="text-xs text-gray-500 mt-2">
              <p>• No payment method on file</p>
              <p>• Upgrade to unlock premium features</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-2">
        {currentUserPlan === 'free' && (
          <Button
            onClick={() => router.push('/subscription')}
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
          >
            Upgrade Plan
          </Button>
        )}

        {/* Show cancel button for active premium/ultimate subscriptions that aren't already cancelled */}
        {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && 
         subscription && subscription.status === 'active' && !subscription.cancelledAt && (
          <Button
            onClick={handleCancelSubscription}
            disabled={cancelling}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
          </Button>
        )}

        {/* Show resubscribe button for cancelled subscriptions */}
        {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && 
         subscription && subscription.cancelledAt && (
          <Button
            onClick={() => router.push('/subscription')}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Resubscribe
          </Button>
        )}

        <div className="space-y-2">
          {/* Payment Method Management */}
          {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && subscription && (
            <Button
              onClick={() => {
                // Open PayPal billing portal or show payment method update
                window.open('https://www.paypal.com/myaccount/autopay/', '_blank');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              Update Payment Method
            </Button>
          )}

          {/* Plan Change Options */}
          <Button
            onClick={() => router.push('/subscription')}
            className="bg-gray-700 hover:bg-gray-600 text-white w-full"
          >
            {currentUserPlan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
          </Button>

          {/* Billing History */}
          {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && (
            <Button
              onClick={() => {
                window.open('https://www.paypal.com/myaccount/transactions/', '_blank');
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white w-full"
            >
              View Billing History
            </Button>
          )}
        </div>
      </div>

      {/* Payment Status Warnings */}
      {subscription && subscription.cancelReason === 'payment_failed' && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-red-400 font-medium">Payment Failed</p>
              <p className="text-red-300 text-sm">Your subscription was cancelled due to a failed payment. Please update your payment method and resubscribe.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSection;