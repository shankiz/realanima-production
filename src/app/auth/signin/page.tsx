'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signInWithEmail, signInWithGoogle, resendEmailVerification, resetPassword } from '@/lib/firebase/auth';

function SignInForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showResendOption, setShowResendOption] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams?.get('redirect');

  useEffect(() => {
    if (searchParams?.get('verified') === 'true') {
      setShowVerifiedMessage(true);
      // Clear the URL parameter
      router.replace('/auth/signin', { scroll: false });
    }
  }, [searchParams, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setShowResendOption(false);

    try {
      await signInWithEmail(formData.email, formData.password);
      router.push(redirectUrl || '/chat');
    } catch (error: unknown) {
      console.error('Sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('verify your email')) {
        setShowResendOption(true);
        setError('Please verify your email before signing in. Check your inbox and spam folder.');
      } else if (errorMessage.includes('user-not-found')) {
        setError('No account found with this email address.');
      } else if (errorMessage.includes('wrong-password') || errorMessage.includes('invalid-credential')) {
        setError('Incorrect email or password.');
      } else if (errorMessage.includes('too-many-requests')) {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(errorMessage || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      console.log('Google sign-in successful:', result);
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push(redirectUrl || '/chat');
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email || !formData.password) {
      setError('Please enter your email and password first.');
      return;
    }

    setResendLoading(true);
    setResendMessage('');

    try {
      await resendEmailVerification(formData.email, formData.password);
      setResendMessage('Verification email sent! Check your inbox and spam folder.');
      setShowResendOption(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first.');
      return;
    }

    try {
      await resetPassword(formData.email);
      setResetEmailSent(true);
      setError('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage || 'Failed to send reset email');
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 z-10"></div>
        <Image
          src="/auth-image.png"
          alt="Sign Up"
          fill
          className="object-cover"
          priority
        />
        </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="RealAnima Logo"
                  width={72}
                  height={72}
                  className="drop-shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                />
              </Link>
            </div>
            <h1 className="text-2xl text-white mb-8" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>Login to your account</h1>
          </div>

          {showVerifiedMessage && (
            <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 text-xs">
              ✅ Email verified successfully! You can now sign in to your account.
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          {resendMessage && (
            <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg text-green-400 text-xs">
              {resendMessage}
            </div>
          )}

          {resetEmailSent && (
            <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-blue-400 text-xs">
              Password reset email sent! Check your inbox and spam folder.
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 border border-gray-300 shadow-sm transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              {googleLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium">Continue with Google</span>
                </>
              )}
            </button>

            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-3 text-gray-400">or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-sm backdrop-blur-sm"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-gray-900/70 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 text-sm backdrop-blur-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 hover:from-purple-700 hover:via-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] text-sm shadow-lg hover:shadow-purple-500/25 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black mt-6"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {showResendOption && (
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-xs mb-2">Need to verify your email?</p>
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full py-2 text-blue-400 border border-blue-500 rounded-lg hover:bg-blue-900/20 transition-colors text-xs disabled:opacity-50"
                >
                  {resendLoading ? 'Sending...' : 'Resend verification email'}
                </button>
              </div>
            )}

            <div className="text-center space-y-3 pt-4">
              <button
                onClick={handleForgotPassword}
                className="text-gray-400 hover:text-purple-400 transition-colors text-sm"
              >
                Forgot your password?
              </button>

              <div className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 transition-colors font-medium underline-offset-4 hover:underline">
                  Sign up
                </Link>
              </div>

              <p className="text-gray-500 text-xs leading-relaxed max-w-xs mx-auto px-4">
                By signing in, you agree to our{' '}
                <span className="text-gray-400 hover:text-gray-300 cursor-pointer">Terms of Service</span>
                {' '}and{' '}
                <span className="text-gray-400 hover:text-gray-300 cursor-pointer">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}