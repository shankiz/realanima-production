'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { applyActionCode, auth } from '@/lib/firebase/config';
import Link from 'next/link';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleEmailVerification = async () => {
      const actionCode = searchParams?.get('oobCode');

      if (!actionCode) {
        setStatus('error');
        setError('Invalid verification link');
        return;
      }

      try {
        console.log('🔐 Applying email verification code...');
        await applyActionCode(auth, actionCode);

        console.log('✅ Email verification successful!');
        setStatus('success');

        // Try to sync verification status with backend if user is signed in
        const user = auth.currentUser;
        if (user) {
          try {
            const idToken = await user.getIdToken(true);
            await fetch('/api/auth/sync-verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken })
            });
            console.log('✅ Verification status synced with backend');
          } catch (syncError) {
            console.log('⚠️ Could not sync verification status:', syncError);
          }
        }

      } catch (error: unknown) {
        console.error('❌ Email verification failed:', error);
        setStatus('error');

        // Type check the error to safely access properties
        const errorCode = (error as any)?.code;

        if (errorCode === 'auth/expired-action-code') {
          setError('This verification link has expired. Please request a new one.');
        } else if (errorCode === 'auth/invalid-action-code') {
          setError('This verification link is invalid. Please request a new one.');
        } else {
          setError('Failed to verify email. Please try again.');
        }
      }
    };

    handleEmailVerification();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-xl font-medium text-white mb-2">Verifying your email...</h2>
              <p className="text-gray-400 text-sm">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-white mb-2">Email verified!</h2>
              <p className="text-gray-400 text-sm mb-6">Your email has been successfully verified. You can now sign in to your account.</p>
              <Link
                href="/auth/signin?verified=true"
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                Sign In Now
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-medium text-white mb-2">Verification failed</h2>
              <p className="text-gray-400 text-sm mb-6">{error}</p>
              <div className="space-y-3">
                <Link
                  href="/auth/signin"
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block"
                >
                  Go to Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="w-full py-2 px-4 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors inline-block"
                >
                  Sign Up Again
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}