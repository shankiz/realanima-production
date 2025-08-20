'use client';

import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useAuth } from '@/app/AuthProvider';
import { SUBSCRIPTION_PLANS } from '@/services/PayPalSubscriptionService';
import SuccessModal from '@/components/SuccessModal';

interface PayPalSubscriptionProps {
  planId: keyof typeof SUBSCRIPTION_PLANS;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function PayPalSubscription({ planId, onSuccess, onError }: PayPalSubscriptionProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const plan = SUBSCRIPTION_PLANS[planId];

  if (!plan) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">Invalid subscription plan</p>
        </div>
      </div>
    );
  }

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
    vault: true,
    intent: "subscription",
    components: "buttons",
    "data-sdk-integration-source": "button-factory",
  };

  const createSubscription = async () => {
    try {
      setLoading(true);
      setMessage('Creating subscription...');

      if (!user) {
        throw new Error('Please sign in to subscribe');
      }

      const response = await fetch('/api/subscription/create-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          planId,
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'User',
          planName: plan.name,
          price: plan.price,
          credits: plan.credits,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription plan');
      }

      // Return the actual subscription ID, not the plan ID
      console.log('✅ PayPal subscription created:', data.subscriptionId);
      return data.subscriptionId;

    } catch (error) {
      console.error('❌ Subscription creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error: ${errorMessage}`);
      onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      setLoading(true);
      setMessage('Processing subscription...');

      if (!user) {
        throw new Error('Please sign in to complete subscription');
      }

      console.log('🎉 Subscription approved! ID:', data.subscriptionID);

      const response = await fetch('/api/subscription/approve-native', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          subscriptionId: data.subscriptionID,
          userId: user.uid,
          planId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process subscription');
      }

      console.log('✅ Subscription processed successfully');
      setMessage('Subscription activated successfully!');

      if (result.success) {
        console.log('✅ Subscription setup completed successfully');
        localStorage.setItem('justUpgraded', 'true');
        onSuccess?.();
      }

      setTimeout(() => {
        setShowSuccessModal(true);
      }, 1000);

    } catch (error) {
      console.error('❌ Approval error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Error: ${errorMessage}`);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="paypal-subscription-container">
      {message && (
        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
          <p className="text-blue-400">{message}</p>
        </div>
      )}

      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{
            shape: "rect",
            layout: "vertical",
            color: "gold",
            label: "subscribe",
            height: 48,
          }}
          disabled={loading}
          createSubscription={createSubscription}
          onApprove={onApprove}
          onCancel={() => {
            setMessage('Subscription was cancelled');
            setLoading(false);
          }}
          onError={(err) => {
            console.error('❌ PayPal error:', err);
            setMessage('PayPal subscription error occurred');
            onError?.('PayPal error occurred');
            setLoading(false);
          }}
        />
      </PayPalScriptProvider>

      {loading && (
        <div className="mt-4">
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
              <span className="ml-3 text-blue-400">Processing...</span>
            </div>
            <p className="text-gray-400 text-sm">Please do not close this window</p>
          </div>
        </div>
      )}

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Subscription Activated! 🎉"
        message="Your subscription has been successfully activated. You can now enjoy unlimited access to all characters!"
        onNavigate={() => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('refreshUserData', 'true');
            window.location.href = '/chat';
          }
        }}
      />
    </div>
  );
}