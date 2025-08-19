
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { SimplifiedVoiceService } from '@/services/SimplifiedVoiceService';
import { useAuth } from '@/app/AuthProvider';

// Wrap the CallPage component in a Suspense boundary
export default function CallPageWrapper() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen bg-black">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-400"></div>
    </div>}> 
      <CallPage />
    </Suspense>
  );
}

function CallPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const character = searchParams?.get('character');

  // Call states
  const [callStatus, setCallStatus] = useState<'connecting' | 'greeting' | 'listening' | 'processing' | 'speaking' | 'ended'>('connecting');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [isCallActive, setIsCallActive] = useState(false);
  
  // Voice service
  const voiceServiceRef = useRef<SimplifiedVoiceService | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Character info helpers
  const getCharacterName = (char: string) => {
    const names: Record<string, string> = {
      'gojo': 'Gojo Satoru',
      'mikasa': 'Mikasa Ackerman',
      'megumin': 'Megumin',
      'eren': 'Eren Yeager',
      'tanjiro': 'Tanjiro Kamado',
      'zenitsu': 'Zenitsu Agatsuma',
      'levi': 'Levi Ackerman',
      'nezuko': 'Nezuko Kamado'
    };
    return names[char] || 'Character';
  };

  const getCharacterImage = (char: string) => `/characters/${char}.png`;

  // Initialize voice service
  useEffect(() => {
    if (!character) {
      router.push('/chat');
      return;
    }

    const deepgramApiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || 'c8cf64a181e7a56f539bfd2203739632a48343b3';
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    voiceServiceRef.current = new SimplifiedVoiceService(deepgramApiKey, geminiApiKey);
    
    // Set up callbacks
    voiceServiceRef.current.setCallbacks({
      onTranscriptUpdate: (transcript, isFinal) => {
        setLiveTranscript(transcript);
        if (isFinal) {
          setCallStatus('processing');
        }
      },
      onResponse: (text, audio, userTranscript) => {
        // Add user message to history
        if (userTranscript) {
          setConversationHistory(prev => [...prev, { role: 'user', content: userTranscript }]);
        }
        
        // Add AI response to history
        setConversationHistory(prev => [...prev, { role: 'assistant', content: text }]);
        
        // Play audio and update status
        if (audio) {
          setCallStatus('speaking');
          const audioElement = new Audio(audio);
          audioElementRef.current = audioElement;
          
          audioElement.onended = () => {
            setCallStatus('listening');
            setLiveTranscript('');
          };
          
          audioElement.play().catch(console.error);
        } else {
          setCallStatus('listening');
          setLiveTranscript('');
        }
      },
      onError: (error) => {
        console.error('Voice service error:', error);
        setCallStatus('listening');
      }
    });

    voiceServiceRef.current.setCharacter(character);

    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
      }
    };
  }, [character, router]);

  // Start the call
  useEffect(() => {
    const startCall = async () => {
      if (!voiceServiceRef.current || !character) return;

      try {
        setCallStatus('greeting');
        
        // Get character greeting
        const greeting = await voiceServiceRef.current.generateGreeting();
        
        if (greeting) {
          // Add greeting to conversation history
          setConversationHistory([{ role: 'assistant', content: greeting.text }]);
          
          // Play greeting audio
          setCallStatus('speaking');
          const audioElement = new Audio(greeting.audio);
          audioElementRef.current = audioElement;
          
          audioElement.onended = () => {
            setCallStatus('listening');
            setIsCallActive(true);
            // Start listening for user input
            voiceServiceRef.current?.startListening();
          };
          
          audioElement.play().catch(console.error);
        } else {
          throw new Error('Failed to generate greeting');
        }
      } catch (error) {
        console.error('Failed to start call:', error);
        setCallStatus('ended');
      }
    };

    if (voiceServiceRef.current) {
      startCall();
    }
  }, [character]);

  // End call function
  const endCall = () => {
    setCallStatus('ended');
    setIsCallActive(false);
    
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopListening();
    }
    
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    
    // Return to chat after a short delay
    setTimeout(() => {
      router.push(`/chat?character=${character}`);
    }, 2000);
  };

  // Redirect if not authenticated or not Ultimate user
  useEffect(() => {
    if (!loading && (!user)) {
      router.push('/auth/signin');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-cyan-400"></div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="flex justify-center items-center h-screen bg-black text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Character not found</h1>
          <button 
            onClick={() => router.push('/chat')}
            className="bg-cyan-600 hover:bg-cyan-700 px-6 py-3 rounded-lg"
          >
            Back to Chat
          </button>
        </div>
      </div>
    );
  }

  const getStatusText = () => {
    switch (callStatus) {
      case 'connecting': return 'Connecting...';
      case 'greeting': return 'Preparing greeting...';
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'speaking': return 'Speaking...';
      case 'ended': return 'Call ended';
      default: return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (callStatus) {
      case 'connecting': return 'text-yellow-400';
      case 'greeting': return 'text-cyan-400';
      case 'listening': return 'text-green-400';
      case 'processing': return 'text-blue-400';
      case 'speaking': return 'text-purple-400';
      case 'ended': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
        <div className="flex items-center space-x-4">
          <button
            onClick={endCall}
            className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Voice Call</h1>
            <p className="text-gray-400 text-sm">with {getCharacterName(character)}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-lg font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          <div className="text-gray-500 text-sm">
            {conversationHistory.length > 0 && `${Math.floor(conversationHistory.length / 2)} exchanges`}
          </div>
        </div>
      </div>

      {/* Main call interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Character avatar with pulse effect */}
        <div className="relative mb-8">
          <div className={`absolute inset-0 rounded-full animate-pulse ${
            callStatus === 'listening' ? 'bg-green-500/20' :
            callStatus === 'processing' ? 'bg-blue-500/20' :
            callStatus === 'speaking' ? 'bg-purple-500/20' :
            'bg-gray-500/20'
          }`} style={{ transform: 'scale(1.1)' }} />
          
          <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-gray-700">
            <Image 
              src={getCharacterImage(character)}
              alt={getCharacterName(character)}
              fill
              className="object-cover object-top"
            />
          </div>
          
          {/* Microphone indicator */}
          {callStatus === 'listening' && (
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-600 rounded-full p-3 animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Live transcript */}
        {liveTranscript && (
          <div className="bg-gray-900/50 backdrop-blur rounded-2xl p-6 mb-6 max-w-2xl w-full">
            <p className="text-gray-300 text-center">
              <span className="text-cyan-400 font-medium">You: </span>
              {liveTranscript}
            </p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center max-w-lg">
          {callStatus === 'connecting' && (
            <p className="text-gray-400">Setting up your call with {getCharacterName(character)}...</p>
          )}
          {callStatus === 'greeting' && (
            <p className="text-gray-400">{getCharacterName(character)} is preparing to greet you...</p>
          )}
          {callStatus === 'listening' && (
            <div>
              <p className="text-green-400 font-medium mb-2">Listening - speak naturally</p>
              <p className="text-gray-500 text-sm">Just talk normally, no need to hold any buttons</p>
            </div>
          )}
          {callStatus === 'processing' && (
            <p className="text-blue-400">{getCharacterName(character)} is thinking...</p>
          )}
          {callStatus === 'speaking' && (
            <p className="text-purple-400">{getCharacterName(character)} is speaking...</p>
          )}
          {callStatus === 'ended' && (
            <div>
              <p className="text-red-400 font-medium mb-2">Call ended</p>
              <p className="text-gray-500 text-sm">Returning to chat...</p>
            </div>
          )}
        </div>

        {/* End call button */}
        {isCallActive && (
          <button
            onClick={endCall}
            className="mt-8 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full transition-colors font-medium"
          >
            End Call
          </button>
        )}
      </div>

      {/* Conversation history (hidden but maintains context) */}
      <div className="hidden">
        {conversationHistory.map((msg, index) => (
          <div key={index} className={msg.role}>
            {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
}
