'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import PayPalSubscription from '@/components/PayPalSubscription';
import SuccessModal from '@/components/SuccessModal';
import SplashCursor from '@/components/SplashCursor';
import { useAuth } from '@/app/AuthProvider';

export default function Subscription() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayPal, setShowPayPal] = useState(false);
  const [currentUserPlan, setCurrentUserPlan] = useState<'free' | 'premium' | 'ultimate'>('free');
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [splashCursorEnabled, setSplashCursorEnabled] = useState(true);

  // Fetch user's current plan
  useEffect(() => {
    const fetchUserPlan = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUserPlan(data.currentPlan || 'free');
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlan();
  }, [user]);

  // Listen for payment success from URL parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const fromPayment = urlParams.get('payment');

      if (fromPayment === 'success') {
        // Refresh user plan data
        const refreshUserPlan = async () => {
          if (!user) return;

          try {
            const token = await user.getIdToken();
            const response = await fetch('/api/user/profile', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();
              setCurrentUserPlan(data.currentPlan || 'free');
            }
          } catch (error) {
            console.error('Error refreshing user plan:', error);
          }
        };

        refreshUserPlan();

        // Clean up URL
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [user]);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      credits: '30',
      description: 'Get started with basic access',
      features: ['30 messages per day', 'Access to all characters', 'Text responses only', 'Basic conversations'],
      popular: false,
      current: currentUserPlan === 'free',
      gradient: 'from-gray-600 to-gray-800'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 3.88,
      credits: '200',
      description: 'Enhanced experience with voice',
      features: ['200 messages per day', 'Access to all characters', 'Text & voice responses', 'Conversation memory'],
      popular: true,
      current: currentUserPlan === 'premium',
      gradient: 'from-purple-500 via-pink-500 to-blue-500'
    },
    {
      id: 'ultimate',
      name: 'Ultimate',
      price: 6.88,
      credits: '500',
      description: 'Premium unlimited access',
      features: ['500 messages per day', 'Access to all characters', 'Text & voice responses', 'Priority voice processing', 'Early access to new characters', 'Custom character requests'],
      popular: false,
      current: currentUserPlan === 'ultimate',
      gradient: 'from-amber-400 via-orange-500 to-red-500'
    }
  ];

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') return;
    setSelectedPlan(planId);
    setShowPayPal(true);
  };

  const handlePayPalSuccess = async () => {
    console.log('🎉 PayPal success handler called, showing success modal in 2 seconds...');
    setShowPayPal(false);
    setSelectedPlan(null);

    // Add a 2-second delay before showing the success modal for better UX
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 2000);

    // Refresh user plan data after successful payment
    if (user) {
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUserPlan(data.currentPlan || 'free');
        }
      } catch (error) {
        console.error('Error refreshing user plan:', error);
      }
    }
  };

  const handlePayPalError = (error: string) => {
    console.error('PayPal error:', error);
    // You can add error handling here
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white flex items-center justify-center relative overflow-hidden">
        {/* Enhanced background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-blue-500/8 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-pink-500/12 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="text-center p-8 bg-gray-900/70 backdrop-blur-sm rounded-2xl border border-gray-700/30 shadow-xl max-w-md mx-4 relative z-10">
          {/* Simple icon */}
          <div className="w-16 h-16 mx-auto mb-6 bg-gray-700 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold mb-3 text-white" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>
            Please Sign In
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-400 text-base mb-8 leading-relaxed">
            You need to be signed in to view subscription plans and unlock amazing characters.
          </p>

          {/* Sign In Button - Centered */}
          <div className="flex justify-center mb-6">
            <Button
              onClick={() => window.location.href = '/auth/signin'}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-0 px-8 py-3 text-base rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg shadow-purple-500/25"
            >
              <span>Sign In Now</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>

          {/* Create account link - centered below button */}
          <p className="text-gray-400 text-sm text-center">
            New here?{' '}
            <button 
              onClick={() => window.location.href = '/auth/signup'}
              className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-2 transition-colors duration-200"
              style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white" suppressHydrationWarning>
      {splashCursorEnabled && <SplashCursor />}

      {/* Splash Cursor Toggle */}
      <div className="absolute right-6 lg:right-10 top-6">
        <button
          onClick={() => setSplashCursorEnabled(!splashCursorEnabled)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
        >
          <span className="text-sm">Splash Cursor</span>
          <div className={`
            w-10 h-5 rounded-full transition-all duration-300 relative cursor-pointer
            ${splashCursorEnabled ? 'bg-purple-600 shadow-lg shadow-purple-600/25' : 'bg-gray-600'}
          `}>
            <div className={`
              w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-sm
              ${splashCursorEnabled ? 'translate-x-5' : 'translate-x-0.5'}
            `} />
          </div>
        </button>
      </div>

      {/* Minimal background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-purple-500/8 rounded-full blur-2xl"></div>
      </div>

      <div className="relative container mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center mb-12">
            <button
              onClick={() => window.history.back()}
              className="absolute left-6 lg:left-10 flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm">Back</span>
            </button>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>
              Choose Your Plan
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Simple pricing for everyone
            </p>
          </div>
        </div>

        {showPayPal && selectedPlan ? (
          <div className="max-w-md mx-auto animate-in fade-in zoom-in duration-500">
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/30 p-8 shadow-2xl relative">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>
                    Complete Subscription
                  </h2>
                  <button
                    onClick={() => setShowPayPal(false)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 p-1.5 rounded-lg hover:bg-gray-700/30"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Plan Details */}
                <div className="mb-6 p-4 bg-gray-800/30 rounded-xl border border-gray-700/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>
                        {plans.find(p => p.id === selectedPlan)?.name} Plan
                      </p>
                      <p className="text-gray-400 text-sm">
                        {plans.find(p => p.id === selectedPlan)?.credits} daily messages and other benefits
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>
                        ${plans.find(p => p.id === selectedPlan)?.price}
                      </p>
                      <p className="text-gray-400 text-sm">/month</p>
                    </div>
                  </div>
                </div>

                <PayPalSubscription
                  planId={selectedPlan}
                  onSuccess={handlePayPalSuccess}
                  onError={handlePayPalError}
                />

                {/* Security badges */}
                <div className="mt-6 flex items-center justify-center space-x-6 text-gray-400 text-xs">
                  <div className="flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Secure Payments</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Instant Access</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Cancel Anytime</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/20"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-purple-500 absolute inset-0"></div>
            </div>
            <span className="mt-6 text-gray-300 text-xl">Loading your plan...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16 -mt-4">
            {plans.map((plan, index) => {
            const isCurrentPlan = currentUserPlan?.toLowerCase() === plan.id.toLowerCase();
            return (
            <Card 
                key={plan.id} 
                className={`
                  relative border transition-all duration-300 hover:scale-[1.02] flex flex-col h-full rounded-2xl overflow-hidden
                  ${isCurrentPlan
                  ? 'border-green-500/50 bg-gray-900/50 shadow-lg shadow-green-500/10'
                  : plan.popular 
                    ? 'bg-gray-900/50 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                    : 'bg-gray-900/30 border-gray-700/30 shadow-lg'
                  }
                `}
              >
                {isCurrentPlan && (
                <div className="absolute top-4 right-4 z-20">
                    <div className="bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium px-3 py-1 rounded-full">
                      CURRENT
                    </div>
                  </div>
                )}
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute top-4 right-4 z-20">
                    <div className="bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium px-3 py-1 rounded-full">
                      POPULAR
                    </div>
                  </div>
                )}

                <CardHeader className="text-center pb-6 pt-8 relative z-10">
                  <CardTitle className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>{plan.name}</CardTitle>
                  <CardDescription className="text-gray-400 text-sm">{plan.description}</CardDescription>
                  <div className="mt-8">
                    <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>
                      ${plan.price}
                    </span>
                    {plan.price > 0 && <span className="text-gray-500 text-base">/month</span>}
                  </div>
                </CardHeader>

                <CardContent className="px-6 flex-grow relative z-10">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-2.5 w-2.5 text-white" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        </div>
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="px-6 pb-6 mt-auto relative z-10">
                  {plan.current ? (
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 text-sm rounded-lg transition-all duration-200"
                      disabled
                      style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}
                    >
                      Current Plan
                    </Button>
                  ) : plan.id === 'free' ? (
                    <Button 
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 text-sm rounded-lg"
                      disabled
                      style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}
                    >
                      Downgrade Available
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`
                        w-full font-medium py-3 text-sm rounded-lg transition-all duration-200
                        ${plan.popular 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                        }
                      `}
                      style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}
                    >
                      Subscribe Now
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
          </div>
        )}

        {/* Security & Trust Section - Only show when not in PayPal modal */}
        {!showPayPal && (
          <div className="text-center mb-32">
            <div className="flex items-center justify-center space-x-12 text-gray-400 text-sm">
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Instant Access</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className={`max-w-3xl mx-auto ${showPayPal ? 'mt-32' : ''}`}>
          <h2 className="text-2xl font-bold text-center mb-8 text-white" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                question: "Can I cancel my subscription anytime?",
                answer: "Yes, you can cancel your subscription at any time from your profile settings. Your access will continue until the end of your billing period."
              },
              {
                question: "What happens to unused messages?",
                answer: "Messages reset daily - you don't keep leftover messages for tomorrow. Free users get 30 daily, Premium gets 200 with high-quality voice, and Ultimate gets 500 with priority voice processing."
              },
              {
                question: "Is my payment information secure?",
                answer: "Yes, all payments are processed securely through PayPal. We never store your payment information on our servers."
              },
              {
                question: "What's included with voice responses?",
                answer: "Voice responses feature realistic AI-generated speech that matches each character's personality, with natural intonation and emotional expression."
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-900/30 border border-gray-700/30 rounded-xl p-5 hover:bg-gray-900/50 transition-all duration-200">
                <h3 className="text-base font-medium mb-2 text-white" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>{faq.question}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Success Modal with Confetti */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Payment Successful!"
          message={(() => {
            // Get the current user plan to determine which subscription was just activated
            const activePlan = plans.find(p => p.id === currentUserPlan);
            if (!activePlan || activePlan.price === 0) {
              return "Your subscription has been successfully activated! 😉";
            }
            return `Your payment of $${activePlan.price.toFixed(2)} has been processed successfully. Your ${activePlan.name} subscription is now activated! 😉`;
          })()}
          onNavigate={() => {
            setShowSuccessModal(false);
            // Force refresh of user data when navigating to chat
            if (typeof window !== 'undefined') {
              localStorage.setItem('refreshUserData', 'true');
              window.location.href = '/chat';
            }
          }}
        />
      </div>
    </div>
  );
}