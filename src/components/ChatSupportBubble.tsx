
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
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 animate-bounce"
          title="Need help? Chat with support"
        >
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
        </button>
      </div>

      {/* Chatbase Iframe Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out"
          onClick={() => setIsOpen(false)}
        >
          <div className="flex items-center justify-center min-h-screen p-4">
            <div 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[700px] transition-all duration-300 ease-out relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-600 to-purple-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5" 
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
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Support Chat</h3>
                    <p className="text-white/80 text-sm">Ask questions, request characters, or get help</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/80 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                >
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
                </button>
              </div>

              {/* Chatbase Iframe */}
              <iframe
                src="https://www.chatbase.co/chatbot-iframe/spPfvHX2tRU-ic83q8sTI"
                width="100%"
                height="calc(100% - 80px)"
                frameBorder="0"
                className="w-full"
                style={{ height: 'calc(100% - 80px)', minHeight: '620px' }}
                title="Support Chat"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
