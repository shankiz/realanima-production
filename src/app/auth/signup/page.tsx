'use client';
import React, { useState } from 'react';
import { signUpWithEmail, resendEmailVerification } from '@/lib/firebase/auth';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { user } = await signUpWithEmail(formData.email, formData.password, formData.name);
      console.log('User created:', user.uid);
      setIsSignedUp(true);
    } catch (error: unknown) {
      console.error('Signup error:', error);
      setError((error as Error).message || 'An error occurred during signup');
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
      router.push('/chat');
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      setError((error as Error).message || 'Failed to sign in with Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setError('');
      await resendEmailVerification(formData.email, formData.password);
    } catch (error: unknown) {
      setError((error as Error).message || 'Failed to resend verification email');
    }
  };

  if (isSignedUp) {
    return (
      <div className="min-h-screen bg-black flex">
        {/* Left side - Image */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 to-blue-900/20 z-10"></div>
          <Image
            src="/auth-image.png"
            alt="Success"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 z-20 flex items-center justify-center p-12">
          </div>
          </div>

        {/* Right side - Success message */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-xs text-center space-y-8">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl text-white font-light">Check your email</h2>
              <div className="space-y-2">
                <p className="text-gray-400 text-sm">Verification sent to</p>
                <p className="text-white text-sm">{formData.email}</p>
                <p className="text-gray-500 text-xs">
                  Click the link to verify your account
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleResendVerification}
                className="w-full py-3 text-gray-400 border border-gray-800 rounded hover:bg-gray-900 transition-colors text-sm"
              >
                Resend email
              </button>

              <Link
                href="/auth/signin"
                className="w-full py-3 bg-white hover:bg-gray-100 text-black rounded transition-colors inline-block text-center font-medium text-sm"
              >
                Continue to sign in
              </Link>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 rounded text-red-400 text-xs text-center">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
        <div className="absolute inset-0 z-20 flex items-center justify-center p-12">
        </div>
        </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xs space-y-8">
          <div className="text-center">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="RealAnima Logo"
                width={48}
                height={48}
                className="mx-auto mb-6 cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
            <h1 className="text-xl text-white font-light">Create account</h1>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 rounded text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <button
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
              className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 rounded transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {googleLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm">Google</span>
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-black px-4 text-gray-500 text-xs">or</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Full name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-transparent border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-transparent border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
              />

              <input
                type="password"
                name="password"
                placeholder="Password (6+ characters)"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-transparent border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
              />

              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-transparent border border-gray-800 rounded text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 transition-colors"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-white hover:bg-gray-100 text-black rounded transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="text-center">
              <div className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link href="/auth/signin" className="text-white hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}