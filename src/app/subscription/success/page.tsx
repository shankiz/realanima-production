'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SubscriptionSuccessContent() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const subscriptionStatus = searchParams?.get('subscription');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8 text-center">
          <div className="text-6xl mb-6">🎉</div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Subscription Activated!
          </h1>

          <p className="text-xl text-gray-300 mb-6">
            Your subscription has been successfully activated. You can now enjoy unlimited access to all characters!
          </p>

          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-8">
            <p className="text-green-400 font-semibold">
              ✅ Credits have been added to your account
            </p>
            <p className="text-green-300 text-sm mt-2">
              Your daily credits will be automatically renewed
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/chat?subscription=success"
              className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-300"
              onClick={() => {
                // Force refresh of user data when navigating to chat
                if (typeof window !== 'undefined') {
                  localStorage.setItem('refreshUserData', 'true');
                  localStorage.setItem('justUpgraded', 'true');
                }
              }}
            >
              Start Chatting
            </Link>
            <Link
              href="/profile"
              className="block w-full bg-gray-700 text-white py-3 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-300"
            >
              View Profile
            </Link>
            <Link
              href="/"
              className="block w-full text-purple-400 hover:text-purple-300 transition-colors duration-300 py-2"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}