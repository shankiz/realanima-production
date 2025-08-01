'use client';

import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useAuth } from '@/app/AuthProvider';
import { SUBSCRIPTION_PLANS } from '@/services/PayPalSubscriptionService';
import SuccessModal from '@/components/SuccessModal'; // Import the SuccessModal component

interface PayPalSubscriptionProps {
  planId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export default function PayPalSubscription({ planId, onSuccess, onError }: PayPalSubscriptionProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // State for the success modal

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
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    "enable-funding": "",
    "disable-funding": "",
    currency: "USD",
    "data-page-type": "product-details",
    components: "buttons",
    "data-sdk-integration-source": "developer-studio",
  };

  return (
    <div className="paypal-subscription-container">
      {message && (
        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-500/50 rounded-lg">
          <p className="text-blue-400">{message}</p>
        </div>
      )}

      {paypalError ? (
        <div className="mb-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-400 font-semibold">PayPal Error</span>
            </div>
            <p className="text-red-300 text-sm mb-3">{paypalError}</p>
            <button
              onClick={() => {
                setPaypalError(null);
                window.location.reload();
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Retry Payment
            </button>
          </div>
        </div>
      ) : (
        <PayPalScriptProvider 
          options={initialOptions}
        >
          <PayPalButtons
          style={{
            shape: "rect",
            layout: "vertical",
            color: "gold",
            label: "paypal",
            height: 48,
          }}
          disabled={isLoading}
          createVaultSetupToken={async () => {
            try {
              setIsLoading(true);
              setMessage('Setting up subscription...');

              if (!user) {
                throw new Error('Please sign in to subscribe');
              }

              const token = await user.getIdToken();
              const returnUrl = `${window.location.origin}/subscription/success`;
              const cancelUrl = `${window.location.origin}/subscription/cancel`;

              console.log('🔧 Sending setup request:', { planId, returnUrl, cancelUrl });

              const response = await fetch('/api/subscription/setup', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  planId,
                  returnUrl,
                  cancelUrl,
                }),
              });

              const data = await response.json();

              console.log('🔍 Setup response:', { status: response.status, data });

              if (!response.ok) {
                console.error('❌ Setup token creation failed:', data);
                throw new Error(data.error || 'Failed to create setup token');
              }

              setMessage('Setup token created successfully!');
              console.log('✅ Setup token ID:', data.id);
              return data.id;

            } catch (error) {
              console.error('❌ Setup token error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              setMessage(`Error: ${errorMessage}`);
              onError?.(errorMessage);
              throw error;
            } finally {
              setIsLoading(false);
            }
          }}
          onApprove={async (data) => {
            try {
              setIsLoading(true);
              setMessage('Processing subscription approval...');

              if (!user) {
                throw new Error('Please sign in to complete subscription');
              }

              const token = await user.getIdToken();

              console.log('🔧 Sending approval request:', { setupTokenId: data.vaultSetupToken, planId });

              const response = await fetch('/api/subscription/approve', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                  setupTokenId: data.vaultSetupToken,
                  planId,
                }),
              });

              const result = await response.json();

              console.log('🔍 Approval response:', { status: response.status, result });

              if (!response.ok) {
                console.error('❌ Subscription approval failed:', result);
                throw new Error(result.error || 'Failed to approve subscription');
              }

              console.log('✅ Subscription activated, showing success modal in 2 seconds...');
              setMessage('Subscription activated successfully!');
              
              // Add a 2-second delay before showing the success modal for better UX
              setTimeout(() => {
                setShowSuccessModal(true);
                onSuccess?.(); // Then call the success callback
              }, 2000);

            } catch (error) {
              console.error('❌ Approval error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              setMessage(`Error: ${errorMessage}`);
              onError?.(errorMessage);
            } finally {
              setIsLoading(false);
            }
          }}
          onCancel={() => {
            setMessage('Subscription setup was cancelled');
            setIsLoading(false);
          }}
          onError={(err) => {
            console.error('❌ PayPal error:', err);
            setMessage('An error occurred with PayPal payment processing');
            onError?.('PayPal error occurred');
            setIsLoading(false);
          }}
        />
        </PayPalScriptProvider>
      )}

      {isLoading && (
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

        {/* Success Modal with Confetti */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Subscription Activated! 🎉"
          message="Your subscription has been successfully activated. You can now enjoy unlimited access to all characters!"
          onNavigate={() => {
            // Force refresh of user data when navigating to chat
            if (typeof window !== 'undefined') {
              localStorage.setItem('refreshUserData', 'true');
              window.location.href = '/chat';
            }
          }}
        />
      </div>
    );
  }