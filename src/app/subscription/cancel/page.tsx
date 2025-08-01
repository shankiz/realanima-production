
'use client';

import Link from 'next/link';

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/40 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-8 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Subscription Cancelled</h1>
          <p className="text-gray-300">
            Your subscription setup was cancelled. No charges were made.
          </p>
        </div>

        <div className="bg-gray-700/30 rounded-2xl p-4 mb-6">
          <p className="text-gray-300 text-sm">
            You can try again anytime or contact support if you need assistance.
          </p>
        </div>

        <div className="space-y-3">
          <Link 
            href="/buy-credits"
            className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300"
          >
            Try Again
          </Link>
          <Link 
            href="/"
            className="block w-full bg-gray-700 text-white py-3 rounded-2xl font-semibold hover:bg-gray-600 transition-all duration-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
