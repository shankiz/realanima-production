
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';

export default function PrivacyPolicy() {
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
              Privacy Policy
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Last updated: August 28, 2025</p>
        </div>

        <Card className="bg-gray-900/50 border border-gray-700/30 mb-8">
          <CardContent className="p-8">
            <div className="prose prose-invert max-w-none">
              
              <section className="mb-8">
                <h2 className="text-2xl font-bold text-blue-400 mb-4">1. Introduction</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Welcome to RealAnima AI ("we," "our," or "us"). This Privacy Policy explains how we collect, use, protect, and share your personal information when you use our website, mobile application, and related services (collectively, the "Service").
                </p>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We are committed to protecting your privacy and handling your data in an open and transparent manner. This Privacy Policy should be read in conjunction with our Terms of Service and applies to all users of our Service.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  By using our Service, you acknowledge that you have read and understood this Privacy Policy and agree to the collection, use, and disclosure of your information as described herein.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">2. Information We Collect</h2>
                <h3 className="text-xl font-semibold text-white mb-3">2.1 Information You Provide Directly</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When you create an account or use our Service, we may collect:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li><strong>Account Information:</strong> Name, email address, profile picture (via Google OAuth)</li>
                  <li><strong>Communication Data:</strong> Messages you send to AI characters and conversation histories</li>
                  <li><strong>Payment Information:</strong> Billing details processed through PayPal (we do not store payment card information)</li>
                  <li><strong>Support Communications:</strong> Information you provide when contacting customer support</li>
                  <li><strong>User Preferences:</strong> Settings, character preferences, and customization choices</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">2.2 Information Collected Automatically</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  When you use our Service, we automatically collect:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li><strong>Usage Data:</strong> How you interact with our Service, features used, time spent, and navigation patterns</li>
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                  <li><strong>Technical Data:</strong> Performance metrics, error logs, and diagnostic information</li>
                  <li><strong>Cookies and Tracking:</strong> Data collected through cookies, web beacons, and similar technologies</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">2.3 Information from Third Parties</h3>
                <p className="text-gray-300 leading-relaxed">
                  We may receive information from third-party services such as Google (for authentication), PayPal (for payment processing), and analytics providers to improve our Service and user experience.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">3. How We Use Your Information</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use your information for the following purposes:
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">3.1 Service Provision</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Providing and maintaining our AI character chat services</li>
                  <li>Processing and responding to your conversations with AI characters</li>
                  <li>Generating voice responses for premium users</li>
                  <li>Managing your account and subscription preferences</li>
                  <li>Storing conversation history and user preferences</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">3.2 Business Operations</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Processing payments and managing subscriptions</li>
                  <li>Providing customer support and technical assistance</li>
                  <li>Monitoring usage to enforce plan limits and terms</li>
                  <li>Detecting and preventing fraud, abuse, and security threats</li>
                  <li>Complying with legal obligations and resolving disputes</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">3.3 Service Improvement</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Analyzing usage patterns to improve our AI models and features</li>
                  <li>Conducting research and development for new features</li>
                  <li>Personalizing your experience and recommendations</li>
                  <li>Testing and optimizing service performance</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">3.4 Communication</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Sending service-related notifications and updates</li>
                  <li>Providing subscription and billing information</li>
                  <li>Responding to your inquiries and support requests</li>
                  <li>Sending promotional communications (with your consent)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-pink-400 mb-4">4. Information Sharing and Disclosure</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We do not sell, rent, or trade your personal information. We may share your information in the following limited circumstances:
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">4.1 Service Providers</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We work with trusted third-party service providers who assist us in operating our Service:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li><strong>Firebase/Google:</strong> Authentication, database, and hosting services</li>
                  <li><strong>PayPal:</strong> Payment processing and subscription management</li>
                  <li><strong>Fish.Audio:</strong> Voice synthesis and audio processing</li>
                  <li><strong>Google Gemini:</strong> AI conversation processing</li>
                  <li><strong>Replit:</strong> Application hosting and deployment</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">4.2 Legal Requirements</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may disclose your information when required by law or to:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Comply with legal process, court orders, or government requests</li>
                  <li>Protect our rights, property, or safety, or that of our users</li>
                  <li>Investigate fraud, security breaches, or illegal activities</li>
                  <li>Enforce our Terms of Service or other agreements</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">4.3 Business Transfers</h3>
                <p className="text-gray-300 leading-relaxed">
                  In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity, subject to the same privacy protections.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-green-400 mb-4">5. Data Security</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We implement industry-standard security measures to protect your personal information:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li><strong>Encryption:</strong> Data is encrypted in transit and at rest using industry-standard protocols</li>
                  <li><strong>Access Controls:</strong> Strict access controls limit who can access your data</li>
                  <li><strong>Authentication:</strong> Secure authentication systems protect your account</li>
                  <li><strong>Monitoring:</strong> Continuous monitoring for security threats and vulnerabilities</li>
                  <li><strong>Regular Updates:</strong> Security measures are regularly reviewed and updated</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  While we implement robust security measures, no system is completely secure. You should protect your account credentials and report any suspicious activity immediately.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-4">6. Data Retention</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We retain your information for as long as necessary to provide our services and comply with legal obligations:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li><strong>Account Data:</strong> Retained while your account is active and for a reasonable period after deletion</li>
                  <li><strong>Conversation History:</strong> Stored indefinitely unless you delete it or request deletion</li>
                  <li><strong>Payment Records:</strong> Retained for tax and legal compliance purposes</li>
                  <li><strong>Usage Analytics:</strong> Aggregated data may be retained indefinitely for service improvement</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  You can request deletion of your data at any time through your account settings or by contacting us.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-red-400 mb-4">7. Your Privacy Rights</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Depending on your location, you may have the following rights regarding your personal information:
                </p>

                <h3 className="text-xl font-semibold text-white mb-3">7.1 Access and Portability</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Request access to the personal information we hold about you</li>
                  <li>Receive a copy of your data in a portable format</li>
                  <li>View and manage your data through your account settings</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">7.2 Correction and Updates</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Update your account information and preferences</li>
                  <li>Correct inaccurate or incomplete data</li>
                  <li>Modify your communication preferences</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">7.3 Deletion and Restriction</h3>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Delete your account and associated data</li>
                  <li>Request deletion of specific conversations or data</li>
                  <li>Restrict certain processing activities</li>
                </ul>

                <h3 className="text-xl font-semibold text-white mb-3">7.4 Exercising Your Rights</h3>
                <p className="text-gray-300 leading-relaxed">
                  To exercise these rights, contact us at <strong>privacy@realanima.ai</strong> or use the privacy controls in your account settings. We will respond to requests within 30 days.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-indigo-400 mb-4">8. Cookies and Tracking Technologies</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We use cookies and similar technologies to enhance your experience:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li><strong>Essential Cookies:</strong> Required for basic site functionality and security</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and customizations</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand how you use our Service</li>
                  <li><strong>Authentication Tokens:</strong> Maintain your login session securely</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  You can control cookie preferences through your browser settings, though disabling certain cookies may limit site functionality.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-teal-400 mb-4">9. Children's Privacy</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Our Service is designed for users aged 13 and older. We do not knowingly collect personal information from children under 13. If you are under 13, please do not use our Service or provide any personal information.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  If we discover that we have collected information from a child under 13, we will delete that information immediately. Parents who believe their child has provided information to us should contact us at <strong>privacy@realanima.ai</strong>.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4">10. International Data Transfers</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Your information may be transferred to and processed in countries other than your country of residence. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  By using our Service, you consent to the transfer of your information to countries that may have different data protection laws than your country of residence.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-blue-400 mb-4">11. Changes to This Privacy Policy</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or service features. We will notify you of material changes by:
                </p>
                <ul className="list-disc list-inside text-gray-300 mb-4 space-y-2">
                  <li>Posting the updated policy on our website</li>
                  <li>Sending email notifications for significant changes</li>
                  <li>Displaying prominent notices in our Service</li>
                </ul>
                <p className="text-gray-300 leading-relaxed">
                  Your continued use of the Service after changes take effect constitutes acceptance of the updated Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-bold text-purple-400 mb-4">12. Contact Us</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                  <p className="text-white font-semibold">RealAnima AI - Privacy Team</p>
                  <p className="text-gray-300">Email: privacy@realanima.ai</p>
                  <p className="text-gray-300">General Contact: contact@realanima.ai</p>
                  <p className="text-gray-300">Website: realanima.ai</p>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  We are committed to addressing your privacy concerns and will respond to your inquiries promptly and professionally.
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
