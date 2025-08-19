
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { SimplifiedVoiceService } from '@/services/SimplifiedVoiceService';
import { useAuth } from '@/app/AuthProvider';

export default function CallPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const character = params?.character as string;
  
  // Call states
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'listening' | 'processing' | 'ended'>('connecting');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [conversationHistory, setConversationHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [currentUserPlan, setCurrentUserPlan] = useState<'free' | 'premium' | 'ultimate'>('free');
  const [callError, setCallError] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  // Voice service ref
  const voiceServiceRef = useRef<SimplifiedVoiceService | null>(null);
  const callStartTime = useRef<number>(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Check user plan and Ultimate access
  useEffect(() => {
    const checkUserAccess = async () => {
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCurrentUserPlan(data.currentPlan || 'free');
          
          // Check if user has Ultimate access for calling
          if (data.currentPlan !== 'ultimate') {
            router.push(`/chat?character=${character}&upgrade=call`);
            return;
          }
        }
      } catch (error) {
        console.error('Error checking user access:', error);
        router.push('/chat');
      }
    };

    checkUserAccess();
  }, [user, character, router]);

  // Initialize voice service and start call
  useEffect(() => {
    if (!user || !character || currentUserPlan !== 'ultimate') return;

    const initializeCall = async () => {
      try {
        console.log('🔊 Initializing call with character:', character);
        
        // Get API keys from environment
        const deepgramKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
        const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        
        if (!deepgramKey || !geminiKey) {
          throw new Error('Missing API keys');
        }

        // Initialize voice service
        voiceServiceRef.current = new SimplifiedVoiceService(deepgramKey, geminiKey);
        voiceServiceRef.current.setCharacter(character);
        
        // Set up callbacks
        voiceServiceRef.current.setCallbacks({
          onTranscriptUpdate: (transcript, isFinal) => {
            setLiveTranscript(transcript);
            if (isFinal) {
              setConversationHistory(prev => [...prev, { role: 'user', content: transcript }]);
            }
          },
          onResponse: (text, audio, userTranscript) => {
            setCallStatus('processing');
            
            // Add AI response to conversation
            setConversationHistory(prev => [...prev, { role: 'assistant', content: text }]);
            
            // Play audio response
            if (audio) {
              setIsAudioPlaying(true);
              const audioElement = new Audio(audio);
              audioElement.onended = () => {
                setIsAudioPlaying(false);
                setCallStatus('listening');
              };
              audioElement.onerror = () => {
                setIsAudioPlaying(false);
                setCallStatus('listening');
              };
              audioElement.play().catch(error => {
                console.error('Audio playback error:', error);
                setIsAudioPlaying(false);
                setCallStatus('listening');
              });
            } else {
              setCallStatus('listening');
            }
            
            // Clear live transcript after processing
            setLiveTranscript('');
          },
          onError: (error) => {
            console.error('Voice service error:', error);
            setCallError(error);
            setCallStatus('ended');
          }
        });

        // Start the call
        const greeting = await voiceServiceRef.current.startCall();
        
        if (greeting) {
          setCallStatus('connected');
          setConversationHistory([{ role: 'assistant', content: greeting.text }]);
          
          // Play greeting
          if (greeting.audio) {
            setIsAudioPlaying(true);
            const audioElement = new Audio(greeting.audio);
            audioElement.onended = async () => {
              setIsAudioPlaying(false);
              setCallStatus('listening');
              
              // Start listening after greeting
              await voiceServiceRef.current?.startListening();
            };
            audioElement.play().catch(error => {
              console.error('Greeting playback error:', error);
              setIsAudioPlaying(false);
              setCallStatus('listening');
            });
          } else {
            setCallStatus('listening');
            await voiceServiceRef.current.startListening();
          }
          
          // Start call duration timer
          callStartTime.current = Date.now();
          durationInterval.current = setInterval(() => {
            setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
          }, 1000);
        } else {
          throw new Error('Failed to initialize call');
        }
        
      } catch (error) {
        console.error('Call initialization error:', error);
        setCallError('Failed to start call. Please try again.');
        setCallStatus('ended');
      }
    };

    initializeCall();

    // Cleanup on unmount
    return () => {
      if (voiceServiceRef.current) {
        voiceServiceRef.current.stopListening();
      }
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [user, character, currentUserPlan]);

  const endCall = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopListening();
    }
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    setCallStatus('ended');
    
    // Redirect back to chat after 2 seconds
    setTimeout(() => {
      router.push(`/chat?character=${character}`);
    }, 2000);
  };

  const getCharacterName = (char: string) => {
    const names: Record<string, string> = {
      'gojo': 'Gojo Satoru',
      'mikasa': 'Mikasa Ackerman',
      'megumin': 'Megumin',
      'eren': 'Eren Yeager',
      'tanjiro': 'Tanjiro Kamado',
      'zenitsu': 'Zenitsu Agatsuma',
      'levi': 'Levi Ackerman',
      'nezuko': 'Nezuko Kamado',
      'light': 'Light Yagami',
      'lawliet': 'L (Lawliet)',
      'edward': 'Edward Elric',
      'spike': 'Spike Spiegel',
      'kenshin': 'Kenshin Himura',
      'sailor': 'Sailor Moon',
      'inuyasha': 'Inuyasha',
      'kagome': 'Kagome Higurashi',
      'yusuke': 'Yusuke Urameshi',
      'killua': 'Killua Zoldyck',
      'gon': 'Gon Freecss',
      'hisoka': 'Hisoka',
      'kaneki': 'Kaneki Ken',
      'itachi': 'Itachi Uchiha',
      'todoroki': 'Shoto Todoroki',
      'bakugo': 'Katsuki Bakugo',
      'deku': 'Izuku Midoriya',
      'rimuru': 'Rimuru Tempest',
      'senku': 'Senku Ishigami',
      'reigen': 'Reigen Arataka',
      'mob': 'Shigeo Kageyama'
    };
    return names[char] || 'Character';
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = () => {
    switch (callStatus) {
      case 'connecting': return 'Connecting...';
      case 'connected': return 'Connected';
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'ended': return 'Call Ended';
      default: return '';
    }
  };

  if (!character) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Invalid character</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/chat?character=${character}`)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-white text-lg font-medium">Voice Call</h1>
            <p className="text-gray-400 text-sm">{getCharacterName(character)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-white text-sm font-mono">
            {formatCallDuration(callDuration)}
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            callStatus === 'connected' || callStatus === 'listening' 
              ? 'bg-green-900/30 text-green-400' 
              : callStatus === 'processing'
              ? 'bg-blue-900/30 text-blue-400'
              : callStatus === 'connecting'
              ? 'bg-yellow-900/30 text-yellow-400'
              : 'bg-red-900/30 text-red-400'
          }`}>
            {getStatusMessage()}
          </div>
        </div>
      </div>

      {/* Main Call Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Character Avatar */}
        <div className="relative mb-8">
          <div className={`w-48 h-48 rounded-full overflow-hidden border-4 transition-all duration-300 ${
            isAudioPlaying 
              ? 'border-cyan-400 shadow-lg shadow-cyan-400/30 scale-105' 
              : callStatus === 'listening'
              ? 'border-green-400 shadow-lg shadow-green-400/30'
              : 'border-gray-600'
          }`}>
            <Image 
              src={`/characters/${character}.png`}
              alt={getCharacterName(character)}
              width={192}
              height={192}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Audio wave animation when character is speaking */}
          {isAudioPlaying && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-2 h-8 bg-cyan-400 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: '0.6s'
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Listening indicator */}
          {callStatus === 'listening' && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-ping" />
            </div>
          )}
        </div>

        {/* Live Transcript */}
        <div className="w-full max-w-2xl mb-8">
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 min-h-[120px]">
            <div className="text-center">
              <h3 className="text-gray-400 text-sm mb-4">Live Transcript</h3>
              <div className="text-white text-lg min-h-[60px] flex items-center justify-center">
                {liveTranscript || (
                  <span className="text-gray-500 italic">
                    {callStatus === 'listening' ? 'Start speaking...' : 'Waiting...'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Conversation History */}
        {conversationHistory.length > 0 && (
          <div className="w-full max-w-2xl mb-8">
            <h3 className="text-gray-400 text-sm mb-4 text-center">Conversation</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {conversationHistory.map((message, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-900/30 ml-8'
                      : 'bg-gray-800/50 mr-8'
                  }`}
                >
                  <div className="text-xs text-gray-400 mb-1">
                    {message.role === 'user' ? 'You' : getCharacterName(character)}
                  </div>
                  <div className="text-white text-sm">{message.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {callError && (
          <div className="w-full max-w-2xl mb-8">
            <div className="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-center">
              <div className="text-red-400 text-sm">{callError}</div>
            </div>
          </div>
        )}

        {/* Call Controls */}
        <div className="flex items-center space-x-6">
          <button
            onClick={endCall}
            className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 3l1.5 1.5M9 9v1.5M21 21l-1.5-1.5M15 15v-1.5" />
            </svg>
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Speak naturally - no need to hold any buttons. The conversation is completely hands-free.
          </p>
        </div>
      </div>
    </div>
  );
}
