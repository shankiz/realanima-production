
'use client';

import React, { useState } from 'react';

interface ChatSupportBubbleProps {
  onlyOnDiscover?: boolean;
  currentView?: string;
}

export default function ChatSupportBubble({ onlyOnDiscover = true, currentView = 'discover' }: ChatSupportBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only show on discover page if onlyOnDiscover is true
  if (onlyOnDiscover && currentView !== 'discover') {
    return null;
  }

  return (
    <>
      {/* Chat Support Bubble */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
          title="Need help? Chat with support"
        >
          {isOpen ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          ) : (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          )}
        </button>
      </div>

      {/* Chatbot Widget - Bottom Right Corner */}
      <div className={`fixed bottom-24 right-6 z-40 transition-all duration-300 ease-out ${
        isOpen ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4 pointer-events-none'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 overflow-hidden border border-gray-200" style={{ height: '100%', minHeight: '700px' }}>
          {/* Chatbase Iframe */}
          <iframe
            src="https://www.chatbase.co/chatbot-iframe/spPfvHX2tRU-ic83q8sTI"
            width="100%"
            frameBorder="0"
            className="w-full h-full rounded-2xl"
            title="Support Chat"
            style={{ height: '100%', minHeight: '700px' }}
          />
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
