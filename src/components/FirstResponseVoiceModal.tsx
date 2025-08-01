
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface FirstResponseVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterName: string;
}

const FirstResponseVoiceModal: React.FC<FirstResponseVoiceModalProps> = ({
  isOpen,
  onClose,
  characterName
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className={`bg-gradient-to-br from-gray-950/95 via-black/95 to-gray-900/95 border border-gray-800/50 rounded-3xl shadow-2xl w-full max-w-md transition-all duration-300 ease-out backdrop-blur-md ${
            isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-3xl pointer-events-none" />

          <div className="relative p-6">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Voice icon with glow effect */}
            <div className="text-center mb-6 pt-2">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full animate-pulse" />
                <div className="relative bg-gradient-to-br from-cyan-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/25">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2a1 1 0 0 1 2 0v2a5 5 0 0 0 10 0v-2a1 1 0 0 1 2 0zM12 15a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0v-3a1 1 0 0 1 1-1z"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Title and subtitle */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                Want to hear {characterName}'s authentic voice?
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                You just experienced the text response - now imagine hearing {characterName} say that in their actual voice!
              </p>
            </div>

            {/* Features list */}
            <div className="mb-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Character-authentic voices</p>
                    <p className="text-gray-400 text-xs mt-0.5">Each character sounds exactly like they should</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Natural speech quality</p>
                    <p className="text-gray-400 text-xs mt-0.5">Human-like, not robotic responses</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-5 h-5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mt-0.5 mr-3">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">Immersive emotional experience</p>
                    <p className="text-gray-400 text-xs mt-0.5">Feel every emotion as characters laugh, get angry or sad, show excitement, etc.</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                onClose();
                router.push('/subscription');
              }}
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white py-3 px-5 rounded-xl transition-all font-medium text-base shadow-lg hover:shadow-cyan-500/20 mb-3"
            >
              Upgrade to Hear Their Voice
            </button>

            {/* Subtle hint */}
            <p className="text-center text-gray-500 text-xs">
              Join thousands experiencing authentic character voices
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstResponseVoiceModal;
