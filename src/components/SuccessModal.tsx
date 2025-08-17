
'use client';

import React, { useEffect, useState } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  onNavigate?: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title = "Subscription Activated!",
  message = "Your subscription has been successfully activated. You can now enjoy unlimited access to all characters!",
  onNavigate
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Small delay before showing modal for smooth transition
      setTimeout(() => {
        setModalVisible(true);
        setShowConfetti(true);
      }, 100);
      
      // Stop confetti after animation
      setTimeout(() => setShowConfetti(false), 3000);
    } else {
      setModalVisible(false);
      setShowConfetti(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate fewer, more elegant confetti pieces
  const confettiPieces = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2.5 + Math.random() * 1.5,
    color: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 5)]
  }));

  return (
    <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-500 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {confettiPieces.map((piece) => (
            <div
              key={piece.id}
              className="absolute w-2 h-2 rounded-full opacity-80"
              style={{
                left: `${piece.left}%`,
                top: '-10px',
                backgroundColor: piece.color,
                animation: `confetti-fall ${piece.duration}s ease-out ${piece.delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <div className={`relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-xl border border-gray-700/30 rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden transform transition-all duration-700 ${modalVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 pointer-events-none" />
        
        {/* Success Icon with Glow */}
        <div className="relative pt-8 pb-6 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
            <div className="relative bg-gradient-to-br from-green-400 to-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-white mb-4 tracking-tight">{title}</h3>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="text-gray-300 text-center mb-6 leading-relaxed">
            {message.includes('Your payment of') ? (
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Payment of ${message.match(/\$(\d+\.\d+)/)?.[1]} processed successfully.
                </p>
                <p className="text-sm">
                  Your {message.includes('Ultimate') ? 'Ultimate' : message.includes('Premium') ? 'Premium' : 'Premium'} subscription is now activated! 😉
                </p>
              </div>
            ) : (
              <p className="text-sm">{message}</p>
            )}
          </div>

          {/* Success Feature Badge */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-400 font-medium text-sm">
                {message.includes('Ultimate') ? 'Ultimate Access Activated' : 
                 message.includes('Premium') ? 'Premium Access Activated' : 
                 'Premium Access Activated'}
              </span>
            </div>
            <p className="text-green-300/80 text-xs text-center">
              All enhanced features are ready for you!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onNavigate?.();
                onClose();
              }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl font-medium text-sm hover:from-green-600 hover:to-emerald-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-green-500/25"
            >
              Start Chatting Now
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-800/50 text-gray-400 py-2.5 px-6 rounded-xl font-medium text-sm hover:bg-gray-700/50 hover:text-gray-300 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animation for Confetti */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessModal;
