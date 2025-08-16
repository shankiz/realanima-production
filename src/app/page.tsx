
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import SplashCursor from '@/components/SplashCursor';
import { useAuth } from './AuthProvider';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Fluid Cursor Effect */}
      <SplashCursor />
      {/* Header Navigation */}
      <header className="absolute top-0 left-0 right-0 z-50 py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/logo.png"
                alt="RealAnima Logo"
                width={28}
                height={28}
                className="mr-2"
              />
              <span className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">RealAnima</span>
            </div>

            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-300 hover:text-blue-400 transition-colors text-sm">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-purple-400 transition-colors text-sm">Pricing</a>
              <a href="#faq" className="text-gray-300 hover:text-orange-400 transition-colors text-sm">FAQ</a>
            </nav>

            <div className="flex space-x-3 min-w-[160px] justify-end">
              {loading ? (
                // Reserve space during loading to prevent layout shift
                <div className="flex space-x-3">
                  <div className="w-[68px] h-[40px]"></div>
                  <div className="w-[76px] h-[40px]"></div>
                </div>
              ) : user ? (
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                  onClick={() => router.push('/chat')}
                >
                  Dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-gray-300 hover:text-white border border-gray-800 hover:bg-gray-900"
                    onClick={() => router.push('/auth/signin')}
                  >
                    Sign In
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
                    onClick={() => router.push('/auth/signup')}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Character Image */}
      <section className="relative pt-0" style={{ zIndex: 1 }}>
        {/* Subtle grid background */}
        <div className="absolute inset-0 grid-background opacity-10"></div>

        {/* Gradient overlay - more subtle and consistent with reference image */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-80"></div>

        <div className="container mx-auto px-4 py-2 md:py-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 mb-6 md:mb-0 space-y-4 pt-2">
              <h1 className="text-5xl md:text-6xl font-bold leading-tight" style={{ fontFamily: 'Shocka Serif, serif' }}>
                Experience
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500">
                  Anime AI Characters
                </span>
                <br />
                Like Never Before
              </h1>
              <p className="text-base text-gray-300 max-w-lg mt-4 leading-relaxed">
                Unleash your imagination. Step into their world, chat, hear their voices, and create your own anime story.
              </p>
              <div className="flex space-x-4 mt-8">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 glow-effect text-base py-6 px-8"
                  onClick={() => router.push('/auth/signup')}
                >
                  Get Started for Free
                </Button>
              </div>
              <p className="text-sm text-gray-400 mt-3">30 messages daily • No credit card required • Instant access</p>
            </div>

            <div className="w-full md:w-1/2 relative h-[800px] md:h-[900px] mx-auto animate-float mt-[-60px] mb-[-180px]" style={{ zIndex: 0 }}>
              {/* Main character image with balanced position */}
              <Image
                src="/image.png"
                alt="Anime AI Character"
                fill
                style={{ objectFit: 'contain' }}
                className="drop-shadow-[0_0_25px_rgba(79,70,229,0.4)]"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 relative bg-black" style={{ zIndex: 20 }}>
        <div className="container mx-auto px-4 relative z-50">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-20" style={{ fontFamily: 'Shocka Serif, serif' }}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Why Choose RealAnima?</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
            <Card className="bg-gray-900/50 border border-gray-700/30 text-white overflow-hidden hover:translate-y-[-5px] transition-all duration-300 p-2 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-blue-400 text-xl">Voice Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Hear characters speak in their authentic voices. Advanced AI creates natural, immersive conversations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-gray-700/30 text-white overflow-hidden hover:translate-y-[-5px] transition-all duration-300 p-2 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-purple-400 text-xl">True Personalities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Each character maintains their unique personality and speech patterns. They respond just like in the anime.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border border-gray-700/30 text-white overflow-hidden hover:translate-y-[-5px] transition-all duration-300 p-2 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-cyan-400 text-xl">Popular Characters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Chat with fan-favorite characters from popular anime series. New characters added regularly.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 relative bg-black" style={{ zIndex: 20 }}>
        <div className="container mx-auto px-4 relative z-50">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-20" style={{ fontFamily: 'Shocka Serif, serif' }}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Simple Pricing for Everyone</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="relative border transition-all duration-300 hover:scale-[1.02] flex flex-col h-full rounded-2xl overflow-hidden bg-gray-900/30 border-gray-700/30 shadow-lg">
              <CardHeader className="text-center pb-6 pt-8 relative z-10">
                <CardTitle className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Shocka Serif, serif' }}>Free</CardTitle>
                <CardDescription className="text-gray-400 text-sm">Get started with basic access</CardDescription>
                <div className="mt-8">
                  <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Shocka Serif, serif' }}>
                    $0
                  </span>
                  <span className="text-gray-500 text-base">/month</span>
                </div>
              </CardHeader>

              <CardContent className="px-6 flex-grow relative z-10">
                <ul className="space-y-3">
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">30 messages per day</span>
                  </li>
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">Access to all characters</span>
                  </li>
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">Text responses only</span>
                  </li>
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">Basic conversations</span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter className="px-6 pb-6 mt-auto relative z-10">
                <Button
                  onClick={() => router.push('/auth/signup')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 text-sm rounded-lg transition-all duration-200"
                  style={{ fontFamily: 'Shocka Serif, serif' }}
                >
                  Get Started Free
                </Button>
              </CardFooter>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border transition-all duration-300 hover:scale-[1.02] flex flex-col h-full rounded-2xl overflow-hidden bg-gray-900/50 border-purple-500/50 shadow-lg shadow-purple-500/10">
              <div className="absolute top-4 right-4 z-20">
                <div className="bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium px-3 py-1 rounded-full">
                  POPULAR
                </div>
              </div>

              <CardHeader className="text-center pb-6 pt-8 relative z-10">
                <CardTitle className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Shocka Serif, serif' }}>Premium</CardTitle>
                <CardDescription className="text-gray-400 text-sm">Enhanced experience with voice</CardDescription>
                <div className="mt-8">
                  <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Shocka Serif, serif' }}>
                    $3.88
                  </span>
                  <span className="text-gray-500 text-base">/month</span>
                </div>
              </CardHeader>

              <CardContent className="px-6 flex-grow relative z-10">
                <ul className="space-y-3">
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">200 messages per day</span>
                  </li>
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">Access to all characters</span>
                  </li>
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">Text & voice responses</span>
                  </li>
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">Conversation memory</span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter className="px-6 pb-6 mt-auto relative z-10">
                <Button
                  onClick={() => router.push('/subscription')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 text-sm rounded-lg transition-all duration-200"
                  style={{ fontFamily: 'Shocka Serif, serif' }}
                >
                  Subscribe Now
                </Button>
              </CardFooter>
            </Card>

            {/* Ultimate Plan */}
            <Card className="relative border transition-all duration-300 hover:scale-[1.02] flex flex-col h-full rounded-2xl overflow-hidden bg-gray-900/30 border-gray-700/30 shadow-lg">
              <CardHeader className="text-center pb-6 pt-8 relative z-10">
                <CardTitle className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Shocka Serif, serif' }}>Ultimate</CardTitle>
                <CardDescription className="text-gray-400 text-sm">Premium unlimited access</CardDescription>
                <div className="mt-8">
                  <span className="text-4xl font-bold text-white" style={{ fontFamily: 'Shocka Serif, serif' }}>
                    $6.88
                  </span>
                  <span className="text-gray-500 text-base">/month</span>
                </div>
              </CardHeader>

              <CardContent className="px-6 flex-grow relative z-10">
                <ul className="space-y-3">
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">500 messages per day</span>
                  </li>
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">Access to all characters</span>
                  </li>
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">Text & voice responses</span>
                  </li>
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">Priority voice processing</span>
                  </li>
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">Early access to new characters</span>
                  </li>
                  <li className="flex items-start">
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
                    <span className="text-gray-300 text-sm">Custom character requests</span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter className="px-6 pb-6 mt-auto relative z-10">
                <Button
                  onClick={() => router.push('/subscription')}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 text-sm rounded-lg transition-all duration-200"
                  style={{ fontFamily: 'Shocka Serif, serif' }}
                >
                  Subscribe Now
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-36 relative bg-black">
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-20" style={{ fontFamily: 'Shocka Serif, serif' }}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400">Frequently Asked Questions</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="bg-gray-900/40 border border-gray-700/30 text-white hover:border-blue-500/30 transition-colors duration-300 p-2 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-blue-400 text-xl">How does RealAnima AI work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm leading-relaxed">
                  RealAnima AI uses advanced AI technology to create realistic conversations with anime characters. 
                  Our system combines natural language processing with voice synthesis to deliver authentic character interactions.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/40 border border-gray-700/30 text-white hover:border-purple-500/30 transition-colors duration-300 p-2 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-purple-400 text-xl">Can I use RealAnima AI on mobile devices?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Yes! You can access RealAnima AI on smartphones, tablets, and computers. 
                  Simply use your web browser to enhance your experience.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/40 border border-gray-700/30 text-white hover:border-cyan-500/30 transition-colors duration-300 p-2 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-cyan-400 text-xl">How many characters are available?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm leading-relaxed">
                  We currently offer a growing library of popular anime characters, with new additions regularly. 
                  All users get access to our character roster, with premium subscribers getting enhanced features.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/40 border border-gray-700/30 text-white hover:border-pink-500/30 transition-colors duration-300 p-2 backdrop-blur-sm">
              <CardHeader className="pb-2 pt-6">
                <CardTitle className="text-pink-400 text-xl">Can I cancel my subscription anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Absolutely! You can cancel your subscription at any time from your account settings. 
                  Your access will continue until the end of your current billing period.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-40 relative overflow-hidden mt-20 bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/20 to-black/90"></div>
        <div className="absolute inset-0 opacity-5">
          <div className="grid-background"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10 max-w-4xl">
          {!loading && user ? (
            <>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'Shocka Serif, serif' }}>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">Welcome Back!</span>
              </h2>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-10">
                Your anime characters are waiting for you. Continue your conversations or discover new personalities.
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white border-0 px-8 py-6 text-lg"
                onClick={() => router.push('/chat')}
              >
                Continue Chatting
              </Button>
            </>
          ) : !loading && (
            <>
              <h2 className="text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: 'Shocka Serif, serif' }}>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Ready to Start Talking?</span>
              </h2>
              <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-10">
                Join thousands of anime fans already having meaningful conversations with their favorite characters.
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-6 text-lg"
                onClick={() => router.push('/auth/signup')}
              >
                Create Your Account
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-16 relative border-t border-gray-800/30">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent"></div>

        <div className="container mx-auto px-4 relative z-10 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="flex items-center mb-2">
                <Image
                  src="/logo.png"
                  alt="RealAnima Logo"
                  width={24}
                  height={24}
                  className="mr-2"
                />
                <h3 className="text-xl font-bold text-white">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">RealAnima AI</span>
                </h3>
              </div>
              <p className="text-gray-400">© 2025 All rights reserved</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
