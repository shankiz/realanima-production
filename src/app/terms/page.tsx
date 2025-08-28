
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function TermsOfService() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center cursor-pointer" onClick={() => router.push('/')}>
              <Image
                src="/logo.png"
                alt="RealAnima Logo"
                width={28}
                height={28}
                className="mr-2"
              />
              <span className="font-medium text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">RealAnima</span>
            </div>
            <Button 
              variant="ghost" 
              className="text-gray-300 hover:text-white"
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Shocka Serif, serif' }}>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Terms of Service
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Last updated: August 28, 2025</p>
        </div>

        <Card className="bg-gray-900/50 border border-gray-700/30 mb-8">
          <CardContent className="p-8">
            <div className="prose prose-invert max-w-none">
              
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-blue-400 mb-4">1. Acceptance of Terms</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Welcome to RealAnima AI ("we," "our," or "us"). By accessing or using our website, mobile application, or any related services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  These Terms constitute a legally binding agreement between you and RealAnima AI. We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting. Your continued use of the Service after any changes indicates your acceptance of the modified Terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">2. Description of Service</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  RealAnima AI is an artificial intelligence platform that enables users to engage in text and voice conversations with AI-powered anime character representations. Our Service includes:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Interactive chat conversations with anime character AI personalities</li>
                  <li>Voice synthesis technology for character responses (premium feature)</li>
                  <li>Conversation history and memory functionality</li>
                  <li>User account management and subscription services</li>
                  <li>Character discovery and selection features</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  The Service is provided on a freemium model with both free and paid subscription tiers offering varying levels of access and features.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">3. Intellectual Property and Character Rights</h2>
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <h3 className="text-yellow-400 font-bold mb-2">Important Character Rights Notice</h3>
                  <p className="text-gray-300 leading-relaxed">
                    <strong>RealAnima AI does not own, claim ownership of, or hold any rights to the anime characters featured on our platform.</strong> All character names, likenesses, personalities, and related intellectual property remain the exclusive property of their respective creators, studios, publishers, and copyright holders.
                  </p>
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-3">3.1 Character Disclaimers</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  The anime characters available on our platform are used for entertainment and educational purposes under fair use principles. We acknowledge that:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Characters are property of their original creators and rights holders</li>
                  <li>Our AI representations are interpretations and not official character content</li>
                  <li>We do not authorize or endorse any commercial use of character likenesses</li>
                  <li>Character personalities and responses are AI-generated and not official canon</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">3.2 Copyright Compliance</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We respect intellectual property rights and operate in compliance with copyright law. If you are a rights holder and believe that any character or content on our platform infringes your intellectual property rights, please contact us immediately at <strong>contact@realanima.ai</strong> with the following information:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Your contact information and proof of rights ownership</li>
                  <li>Specific character(s) or content in question</li>
                  <li>Detailed description of the claimed infringement</li>
                  <li>Requested action (removal, modification, etc.)</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  We will promptly investigate all legitimate copyright claims and take appropriate action, including content removal if necessary.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">3.3 Our Original Content</h3>
                <p className="text-gray-300 leading-relaxed">
                  While we do not own character rights, RealAnima AI retains ownership of our proprietary technology, including our AI models, conversation algorithms, platform design, and original creative elements developed specifically for our Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-pink-400 mb-4">4. User Accounts and Eligibility</h2>
                <h3 className="text-xl font-semibold text-white mb-3">4.1 Account Creation</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  To access certain features of our Service, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">4.2 Eligibility Requirements</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>You must be at least 13 years old to use our Service</li>
                  <li>Users under 18 must have parental consent</li>
                  <li>You must provide accurate registration information</li>
                  <li>You must comply with all applicable laws and regulations</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">4.3 Account Security</h3>
                <p className="text-gray-300 leading-relaxed">
                  You agree to immediately notify us of any unauthorized use of your account or any other breach of security. We are not liable for any loss or damage arising from your failure to protect your account information.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-green-400 mb-4">5. Subscription Plans and Billing</h2>
                <h3 className="text-xl font-semibold text-white mb-3">5.1 Plan Types</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We offer three service tiers:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li><strong>Free Plan:</strong> 30 messages per day, text responses only</li>
                  <li><strong>Premium Plan ($3.88/month):</strong> 200 messages per day, text and voice responses</li>
                  <li><strong>Ultimate Plan ($6.88/month):</strong> 500 messages per day, text and voice responses with priority processing</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">5.2 Billing and Payment</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Subscription fees are billed monthly in advance through PayPal. By subscribing, you authorize us to charge your chosen payment method. All fees are non-refundable except as required by law.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">5.3 Cancellation</h3>
                <p className="text-gray-300 leading-relaxed">
                  You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of your current billing period, and you will retain access until that time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-4">6. Acceptable Use Policy</h2>
                <h3 className="text-xl font-semibold text-white mb-3">6.1 Prohibited Conduct</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Engage in illegal, harmful, or offensive activities</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Share inappropriate, explicit, or harmful content</li>
                  <li>Attempt to reverse engineer or compromise our systems</li>
                  <li>Use automated tools to access the Service (bots, scrapers, etc.)</li>
                  <li>Impersonate others or provide false information</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">6.2 Content Monitoring</h3>
                <p className="text-gray-300 leading-relaxed">
                  While we do not actively monitor all user conversations, we reserve the right to review content for compliance with these Terms and applicable laws. We may suspend or terminate accounts that violate our policies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-red-400 mb-4">7. Privacy and Data Protection</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Your privacy is important to us. Our collection, use, and protection of your personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using our Service, you consent to our privacy practices as described in the Privacy Policy.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  We implement industry-standard security measures to protect your data, but no system is completely secure. You acknowledge that you provide information at your own risk.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">8. Disclaimers and Limitations</h2>
                <h3 className="text-xl font-semibold text-white mb-3">8.1 Service Availability</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We strive to maintain high service availability but cannot guarantee uninterrupted access. The Service is provided "as is" without warranties of any kind, express or implied.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">8.2 AI-Generated Content</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  All character responses are AI-generated and may not accurately represent official character personalities or storylines. We are not responsible for the content, accuracy, or appropriateness of AI-generated responses.
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">8.3 Limitation of Liability</h3>
                <p className="text-gray-300 leading-relaxed">
                  To the maximum extent permitted by law, RealAnima AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-teal-400 mb-4">9. Termination</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may suspend or terminate your access to the Service at any time, with or without cause, with or without notice. Upon termination, your right to use the Service will cease immediately, and we may delete your account and data.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  You may terminate your account at any time by contacting us or using the account deletion feature in your settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">10. Changes to Service</h2>
                <p className="text-gray-300 leading-relaxed">
                  We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time. We may also change our pricing, features, or terms with reasonable notice to users.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-blue-400 mb-4">11. Governing Law</h2>
                <p className="text-gray-300 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts in [Your Jurisdiction].
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">12. Contact Information</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you have any questions about these Terms of Service, please contact us at:
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-white font-semibold">RealAnima AI</p>
                  <p className="text-gray-300">Email: contact@realanima.ai</p>
                  <p className="text-gray-300">Website: realanima.ai</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-green-400 mb-4">13. Severability</h2>
                <p className="text-gray-300 leading-relaxed">
                  If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect and enforceable.
                </p>
              </section>

            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <Button 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8 py-3"
            onClick={() => router.push('/')}
          >
            Return to RealAnima
          </Button>
        </div>
      </div>
    </div>
  );
}
