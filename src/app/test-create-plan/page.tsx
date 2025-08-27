
'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase/auth';

export default function TestCreatePlan() {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const createFreshPremiumPlan = async () => {
    if (!user) {
      setError('Please log in first');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const token = await user.getIdToken();
      
      const response = await fetch('/api/subscription/create-fresh-plan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        console.log('🎉 NEW PREMIUM PLAN CREATED:', data.paypalPlanId);
      } else {
        setError(data.error || 'Failed to create plan');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
          <p>You need to be logged in to create a PayPal plan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Create Fresh Premium Plan
        </h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Instructions:</h2>
          <ul className="text-gray-300 space-y-2 list-disc list-inside">
            <li>Click the button below to create a fresh Premium PayPal plan</li>
            <li>Copy the new Plan ID from the result</li>
            <li>Update your PayPalSubscriptionService.ts with the new Plan ID</li>
            <li>This is a one-time setup - you won't need to do this again</li>
          </ul>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <button
            onClick={createFreshPremiumPlan}
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Creating Premium Plan...' : 'Create Fresh Premium Plan'}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
              <p className="text-red-200 font-semibold">Error:</p>
              <p className="text-red-100">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-green-500/20 border border-green-500 rounded-lg">
              <h3 className="text-green-200 font-bold text-lg mb-2">
                ✅ Success! Premium Plan Created
              </h3>
              <div className="text-green-100 space-y-2">
                <p><strong>Plan ID:</strong> <code className="bg-black/30 px-2 py-1 rounded">{result.paypalPlanId}</code></p>
                <p><strong>Product ID:</strong> <code className="bg-black/30 px-2 py-1 rounded">{result.productId}</code></p>
                <p><strong>Price:</strong> ${result.planDetails.price} USD</p>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg">
                <p className="text-yellow-200 font-semibold">Next Step:</p>
                <p className="text-yellow-100 text-sm">
                  Copy the Plan ID above and update line 20 in your PayPalSubscriptionService.ts file:
                </p>
                <code className="block mt-2 text-xs bg-black/30 p-2 rounded">
                  paypalPlanId: '{result.paypalPlanId}' // Replace with this new ID
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
