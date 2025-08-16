
'use client';

import React, { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

interface ChatSupportBubbleProps {
  showOnDiscoverOnly?: boolean;
  isDiscoverPage?: boolean;
}

const ChatSupportBubble: React.FC<ChatSupportBubbleProps> = ({ 
  showOnDiscoverOnly = true, 
  isDiscoverPage = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Only show on discover page if showOnDiscoverOnly is true
  if (showOnDiscoverOnly && !isDiscoverPage) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={toggleChat}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            aria-label="Open support chat"
          >
            <MessageCircle size={24} />
          </button>
        </div>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden" style={{ width: '400px', height: '600px' }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex justify-between items-center">
              <h3 className="font-semibold">Support Chat</h3>
              <button
                onClick={toggleChat}
                className="text-white hover:text-gray-200 transition-colors"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Chatbase Iframe */}
            <div className="h-full">
              <iframe
                src="https://www.chatbase.co/chatbot-iframe/spPfvHX2tRU-ic83q8sTI"
                width="100%"
                style={{ height: '100%', minHeight: '550px', border: 'none' }}
                frameBorder="0"
                title="Support Chat"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatSupportBubble;
