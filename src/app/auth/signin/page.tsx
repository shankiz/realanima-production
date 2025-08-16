'use client';

import { useState, useEffect, Suspense } from 'react';

// Set page title
useEffect(() => {
  document.title = "Sign In - RealAnima";
}, []);
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
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="RealAnima Logo"
                  width={64}
                  height={64}
                  className="drop-shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                />
              </Link>
            </div>
            <h1 className="text-xl text-white mb-6" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>Login to your account</h1>
          </div>

          {showVerifiedMessage && (
            <div className="p-3 bg-green-500/10 rounded text-green-400 text-xs text-center">
              Email verified successfully
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 rounded text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          {resendMessage && (
            <div className="p-3 bg-green-500/10 rounded text-green-400 text-xs text-center">
              {resendMessage}
            </div>
          )}

          {resetEmailSent && (
            <div className="p-3 bg-blue-500/10 rounded text-blue-400 text-xs text-center">
              Password reset email sent
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-2.5 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}
            >
              {googleLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-black px-3 text-gray-500">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-gray-600"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="text-center space-y-3 pt-2">
              <p className="text-xs text-gray-500 leading-relaxed">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-gray-400 hover:text-white">
                  Terms of Service
                </Link>
                <br />
                and{' '}
                <Link href="/privacy" className="text-gray-400 hover:text-white">
                  Privacy Policy
                </Link>
              </p>
            </div>

            {showResendOption && (
              <div className="text-center">
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="text-gray-400 hover:text-white transition-colors text-sm underline"
                >
                  {resendLoading ? 'Sending...' : 'Resend verification'}
                </button>
              </div>
            )}

            <div className="text-center space-y-3">
              <button
                onClick={handleForgotPassword}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm underline"
              >
                Forgot password?
              </button>

              <div className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-blue-400 hover:underline">
                  Sign up
                </Link>
              </div>
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