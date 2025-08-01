'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
                        import { useRouter } from 'next/navigation';
                        import Image from 'next/image';
                        import axios from 'axios';
                        import { SimplifiedVoiceService } from '@/services/SimplifiedVoiceService';
                        import { CHARACTER_CONTEXTS } from '@/services/CharacterContexts';
                        import { useAuth } from '@/app/AuthProvider';
                        import { ConfirmModal, AlertModal } from '@/components/ui/modal';
                        import BillingSection from '@/components/BillingSection';

                        // Recent conversation item component with delete option
                        const RecentConversationItem = ({ conversation, onClick, onDelete, currentCharacter }) => {
                          const [showMenu, setShowMenu] = useState(false);
                          const menuRef = useRef(null);

                          // Close menu when clicking outside
                          useEffect(() => {
                            const handleClickOutside = (event) => {
                              if (menuRef.current && !menuRef.current.contains(event.target)) {
                                setShowMenu(false);
                              }
                            };

                            if (showMenu) {
                              document.addEventListener('mousedown', handleClickOutside);
                            }

                            return () => {
                              document.removeEventListener('mousedown', handleClickOutside);
                            };
                          }, [showMenu]);

                          return (
                            <div className="relative group" ref={menuRef}>
                              <div 
                                onClick={() => onClick(conversation.id)}
                                className={`cursor-pointer p-1.5 rounded-md transition-colors ${currentCharacter === conversation.id ? 'bg-cyan-900/30 border border-cyan-800/30' : 'hover:bg-gray-950/60'} flex items-center justify-between`}
                              >
                                <div className="flex items-center flex-1 min-w-0">
                                  <Image 
                                    src={conversation.image} 
                                    alt={conversation.name} 
                                    width={24} 
                                    height={24}
                                    className="rounded-full flex-shrink-0"
                                  />
                                  <span className="ml-2 text-xs truncate">{conversation.name}</span>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-800/50 transition-all ml-1 flex-shrink-0"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                  </svg>
                                </button>
                              </div>

                              {/* Delete menu */}
                              {showMenu && (
                                <div className="absolute right-0 top-full mt-1 bg-gray-900/95 border border-gray-800/50 rounded-lg shadow-xl z-50 min-w-[100px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDelete(conversation.id);
                                      setShowMenu(false);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-800/50 rounded-lg transition-colors"
                                  >
                                    Remove from recents
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        };

                        // Character card with minimal design
                        const CharacterCard = ({ character, onClick }) => {
                          // Characters that should have the NEW tag
                          const newCharacters = ['gojo', 'levi', 'mikasa', 'lawliet', 'hisoka', 'reigen', 'mob', 'kaneki'];
                          const isNew = newCharacters.includes(character.id);

                          return (
                            <div 
                              className="border border-white/15 rounded-2xl overflow-hidden transition-all duration-500 hover:border-white/30 cursor-pointer shadow-2xl backdrop-blur-2xl hover:scale-[1.03] hover:shadow-4xl group relative"
                              onClick={onClick}
                              style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.02) 100%)',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(255,255,255,0.05)'
                              }}
                            >
                              {/* Primary glass reflection */}
                              <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-white/3 to-transparent opacity-80 rounded-2xl pointer-events-none"></div>

                              {/* Secondary glass layer for depth */}
                              <div className="absolute inset-0 bg-gradient-to-tl from-transparent via-white/2 to-white/5 rounded-2xl pointer-events-none"></div>

                              <div className="relative h-40 overflow-hidden rounded-t-2xl">
                                <Image 
                                  src={`/characters/${character.id}.png`}
                                  alt={character.name}
                                  fill
                                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                  loading="eager"
                                  priority
                                />
                                {/* Refined gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

                                {/* NEW Tag - Top Right of Image */}
                                {isNew && (
                                  <div className="absolute top-2 right-2 z-20">
                                    <div className="bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-white/30 backdrop-blur-sm">
                                      <div className="tracking-widest">NEW</div>
                                    </div>
                                  </div>
                                )}

                                {/* Glass rim highlight */}
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/25 to-transparent"></div>
                                <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-gradient-to-b from-white/15 via-transparent to-transparent"></div>
                                <div className="absolute top-0 bottom-0 right-0 w-0.5 bg-gradient-to-b from-white/15 via-transparent to-transparent"></div>
                              </div>

                              <div className="relative p-3" style={{
                                background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 100%)'
                              }}>
                                {/* Inner glass reflection for text area */}
                                <div className="absolute inset-0 bg-gradient-to-t from-white/3 via-white/1 to-transparent rounded-b-2xl pointer-events-none"></div>

                                <div className="relative z-10">
                                  <h3 className="text-white font-semibold mb-1 text-xs drop-shadow-lg tracking-wide">{character.name}</h3>
                                  <p className="text-gray-100/95 text-[10px] drop-shadow-md line-clamp-1">{character.description}</p>
                                </div>
                              </div>

                              {/* Enhanced hover glow */}
                              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/8 via-transparent to-purple-400/8 rounded-2xl"></div>
                                <div className="absolute inset-0 bg-gradient-to-tl from-blue-400/5 via-transparent to-pink-400/5 rounded-2xl"></div>
                              </div>

                              {/* Subtle inner border glow */}
                              <div className="absolute inset-0.5 rounded-2xl border border-white/5 pointer-events-none group-hover:border-white/10 transition-colors duration-500"></div>
                            </div>
                          );
                        };

                        // Minimalist discover view
                        const DiscoverView = ({ onSelectCharacter, loading }) => {
                          const { user } = useAuth();
                          const [characters, setCharacters] = useState([
                            // Free Characters
                            { id: 'gojo', name: 'Gojo Satoru', description: 'Jujutsu Kaisen', tier: 'free' },
                            { id: 'mikasa', name: 'Mikasa Ackerman', description: 'Attack on Titan', tier: 'free' },
                            { id: 'megumin', name: 'Megumin', description: 'KonoSuba', tier: 'free' },

                            // Premium Characters
                            { id: 'eren', name: 'Eren Yeager', description: 'Attack on Titan', tier: 'premium' },
                            { id: 'tanjiro', name: 'Tanjiro Kamado', description: 'Demon Slayer', tier: 'premium' },
                            { id: 'zenitsu', name: 'Zenitsu Agatsuma', description: 'Demon Slayer', tier: 'premium' },
                            { id: 'light', name: 'Light Yagami', description: 'Death Note', tier: 'premium' },
                            { id: 'lawliet', name: 'L (Lawliet)', description: 'Death Note', tier: 'premium' },
                            { id: 'edward', name: 'Edward Elric', description: 'Fullmetal Alchemist: Brotherhood', tier: 'premium' },
                            { id: 'spike', name: 'Spike Spiegel', description: 'Cowboy Bebop', tier: 'premium' },
                            { id: 'kenshin', name: 'Kenshin Himura', description: 'Rurouni Kenshin', tier: 'premium' },
                            { id: 'sailor', name: 'Sailor Moon (Usagi Tsukino)', description: 'Sailor Moon', tier: 'premium' },
                            { id: 'inuyasha', name: 'Inuyasha', description: 'Inuyasha', tier: 'premium' },
                            { id: 'kagome', name: 'Kagome Higurashi', description: 'Inuyasha', tier: 'premium' },

                            // Ultimate Characters
                            { id: 'levi', name: 'Levi Ackerman', description: 'Attack on Titan', tier: 'ultimate' },
                            { id: 'nezuko', name: 'Nezuko Kamado', description: 'Demon Slayer', tier: 'ultimate' },
                            { id: 'yusuke', name: 'Yusuke Urameshi', description: 'Yu Yu Hakusho', tier: 'ultimate' },
                            { id: 'killua', name: 'Killua Zoldyck', description: 'Hunter x Hunter', tier: 'ultimate' },
                            { id: 'gon', name: 'Gon Freecss', description: 'Hunter x Hunter', tier: 'ultimate' },
                            { id: 'hisoka', name: 'Hisoka', description: 'Hunter x Hunter', tier: 'ultimate' },
                            { id: 'kaneki', name: 'Kaneki Ken', description: 'Tokyo Ghoul', tier: 'ultimate' },
                            { id: 'itachi', name: 'Itachi Uchiha', description: 'Naruto', tier: 'ultimate' },
                            { id: 'todoroki', name: 'Shoto Todoroki', description: 'My Hero Academia', tier: 'ultimate' },
                            { id: 'bakugo', name: 'Katsuki Bakugo', description: 'My Hero Academia', tier: 'ultimate' },
                            { id: 'deku', name: 'Izuku Midoriya (Deku)', description: 'My Hero Academia', tier: 'ultimate' },
                            { id: 'rimuru', name: 'Rimuru Tempest', description: 'That Time I Got Reincarnated as a Slime', tier: 'ultimate' },
                            { id: 'senku', name: 'Senku Ishigami', description: 'Dr. Stone', tier: 'ultimate' },
                            { id: 'reigen', name: 'Reigen Arataka', description: 'Mob Psycho 100', tier: 'ultimate' },
                            { id: 'mob', name: 'Shigeo Kageyama (Mob)', description: 'Mob Psycho 100', tier: 'ultimate' },
                          ]);
                          const [searchQuery, setSearchQuery] = useState('');

                          const filteredCharacters = characters.filter(char => 
                            char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            char.description.toLowerCase().includes(searchQuery.toLowerCase())
                          );

                          return (
                            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-black to-gray-950">
                              <div className="p-6">
                                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
                                    <div className="mb-4 lg:mb-0">
                                      <h1 className="text-xl font-medium text-white" style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}>
                                        Welcome, <span className="text-cyan-400">{user?.displayName || 'User'}</span>
                                      </h1>
                                      <p className="text-gray-400 mt-1 text-sm">
                                        Discover and chat with characters
                                      </p>
                                    </div>
                                </div>

                                {/* Popular Characters */}
                                <div className="mb-8">
                                  <h2 className="text-xl font-bold text-white mb-4">Popular Characters</h2>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {filteredCharacters.slice(0, 5).map((char) => (
                                      <CharacterCard 
                                        key={char.id} 
                                        character={char} 
                                        onClick={() => onSelectCharacter(char.id)}
                                      />
                                    ))}
                                  </div>
                                </div>

                                {/* All Characters */}
                                <div>
                                  <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-white">All Characters</h2>
                                    <div className="relative w-80">
                                      <input
                                        type="text"
                                        placeholder="Search characters..."
                                        className="w-full bg-black/60 text-white text-sm rounded-lg pl-12 pr-4 py-3 border-2 border-gray-700/50 focus:outline-none focus:border-cyan-500/80 shadow-lg"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                      />
                                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {filteredCharacters.map((char) => (
                                      <CharacterCard 
                                        key={char.id} 
                                        character={char} 
                                        onClick={() => onSelectCharacter(char.id)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        };

                        // Main Chat component with minimalist design
                        export default function Chat() {
                          const { user, signOut, loading } = useAuth();
                          const router = useRouter();
                          const searchParams = useSearchParams();
                          const character = searchParams.get('character');
                          const [view, setView] = useState('discover'); // Default view is discover

                          const [input, setInput] = useState('');
                          const inputRef = useRef<HTMLTextAreaElement>(null);
                          const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
                          const [messages, setMessages] = useState([]);
                          const [isLoading, setIsLoading] = useState(false);
                          const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
                          const [voiceGenerationError, setVoiceGenerationError] = useState(false);
                          const [audioPlayingForMessage, setAudioPlayingForMessage] = useState<number | null>(null);
                          const chatEndRef = useRef(null);
                          const [messagesLeft, setMessagesLeft] = useState<number | null>(null);
                          const [credits, setCredits] = useState<number | null>(null);
                          const [sessionId, setSessionId] = useState('');
                          const [recentConversations, setRecentConversations] = useState([]);
                          // Chat history states
                          const [chatHistory, setChatHistory] = useState([]);
                          const [isLoadingHistory, setIsLoadingHistory] = useState(false);
                          const [loadingConversation, setLoadingConversation] = useState(null);
                          const [historyCache, setHistoryCache] = useState(new Map());

                          // Debug character changes and clear history
                          useEffect(() => {
                            console.log('🎭 [DEBUG] Character changed to:', character);
                            // Clear chat history immediately when character changes to prevent showing wrong conversations
                            setChatHistory([]);
                          }, [character]);

                          const [placeholderText, setPlaceholderText] = useState('');

                          // Voice call states
                          const [isCallActive, setIsCallActive] = useState(false);
                          const [showCallInterface, setShowCallInterface] = useState(false);
                          const [callStatus, setCallStatus] = useState(''); // 'calling', 'speaking', 'listening', 'processing'
                          const [voiceVolume, setVoiceVolume] = useState(0);
                          const [speechDetected, setSpeechDetected] = useState(false);

                          // Voice services
                          const audioRef = useRef<HTMLAudioElement>(null);
                          const [isRecording, setIsRecording] = useState(false);
                          const [liveTranscript, setLiveTranscript] = useState('');
                          const [isProcessing, setIsProcessing] = useState(false);
                          const [currentAudio, setCurrentAudio] = useState<string | null>(null);
                          const [voiceService, setVoiceService] = useState<SimplifiedVoiceService | null>(null);

                          // Live transcription states
                          const [liveTranscriptDisplay, setLiveTranscriptDisplay] = useState('');

                          // Chat sidebar states
                          const [showChatSidebar, setShowChatSidebar] = useState(false);
                          const [showHistorySidebar, setShowHistorySidebar] = useState(false);
                          const [showUserDropdown, setShowUserDropdown] = useState(false);
                          const [showSettingsModal, setShowSettingsModal] = useState(false);
                          const [selectedSettingsTab, setSelectedSettingsTab] = useState('account');
                          const [showAccountManagement, setShowAccountManagement] = useState(false);
                          const [showBillingDropdown, setShowBillingDropdown] = useState(false);
                          const [billingData, setBillingData] = useState(null);
                          // Theme management
                          const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

                          // Auto-scroll state management
                          const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)

                          // Custom modal states
                          const [showConfirmModal, setShowConfirmModal] = useState(false);
                          const [showAlertModal, setShowAlertModal] = useState(false);
                          const [showCreditModal, setShowCreditModal] = useState(false);
                          const [showComingSoonModal, setShowComingSoonModal] = useState(false);
                          const [showFirstResponseVoiceModal, setShowFirstResponseVoiceModal] = useState(false);
                          const [isDeleteHistoryLoading, setIsDeleteHistoryLoading] = useState(false);
                          const [modalConfig, setModalConfig] = useState({
                            title: '',
                            message: '',
                            onConfirm: () => {},
                            type: 'default' as 'default' | 'danger' | 'warning',
                            confirmText: 'Confirm',
                            cancelText: 'Cancel'
                          });
                          const [alertConfig, setAlertConfig] = useState({
                            title: '',
                            message: '',
                            type: 'info' as 'success' | 'error' | 'info',
                            buttonText: 'OK'
                          });

                          useEffect(() => {
                            const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
                            setTheme(savedTheme)

                            const applyTheme = (currentTheme: 'light' | 'dark' | 'system') => {
                              const body = document.body
                              body.classList.remove('light', 'dark')

                              if (currentTheme === 'system') {
                                // For system preference, we'll default to dark mode
                                body.classList.add('dark')
                              } else {
                                body.classList.add(currentTheme)
                              }
                            }

                            applyTheme(savedTheme)
                          }, [])

                          useEffect(() => {
                            const applyTheme = (currentTheme: 'light' | 'dark' | 'system') => {
                              const body = document.body
                              body.classList.remove('light', 'dark')

                              if (currentTheme === 'system') {
                                // For system preference, we'll default to dark mode
                                body.classList.add('dark')
                              } else {
                                body.classList.add(currentTheme)
                              }
                            }

                            applyTheme(theme)
                            localStorage.setItem('theme', theme)
                          }, [theme])

                          // Load auto-scroll preference from localStorage
                          useEffect(() => {
                            const savedAutoScroll = localStorage.getItem('autoScrollEnabled')
                            if (savedAutoScroll !== null) {
                              setAutoScrollEnabled(savedAutoScroll === 'true')
                            }
                          }, [])

                          // Save auto-scroll preference to localStorage
                          useEffect(() => {
                            localStorage.setItem('autoScrollEnabled', autoScrollEnabled.toString())
                          }, [autoScrollEnabled])

                          // Custom confirmation function
                          const showCustomConfirm = (
                            title: string,
                            message: string,
                            onConfirm: () => void,
                            options?: {
                              type?: 'default' | 'danger' | 'warning';
                              confirmText?: string;
                              cancelText?: string;
                            }
                          ) => {
                            setModalConfig({
                              title,
                              message,
                              onConfirm,
                              type: options?.type || 'default',
                              confirmText: options?.confirmText || 'Confirm',
                              cancelText: options?.cancelText || 'Cancel'
                            });
                            setShowConfirmModal(true);
                          };

                          // Custom alert function
                          const showCustomAlert = (
                            title: string,
                            message: string,
                            options?: {
                              type?: 'success' | 'error' | 'info';
                              buttonText?: string;
                            }
                          ) => {
                            setAlertConfig({
                              title,
                              message,
                              type: options?.type || 'info',
                              buttonText: options?.buttonText || 'OK'
                            });
                            setShowAlertModal(true);
                          };

                          // Credit purchase function
                          const purchaseCredits = async (packageType: 'small' | 'medium' | 'large') => {
                            if (!user) return;

                            try {
                              const token = await user.getIdToken();
                              const response = await fetch('/api/credits/purchase', {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ package: packageType })
                              });

                              if (response.ok) {
                                const data = await response.json();
                                // Redirect to PayPal for payment
                                window.location.href = data.approvalUrl;
                              } else {
                                showCustomAlert('Error', 'Failed to create payment. Please try again.', { type: 'error' });
                              }
                            } catch (error) {
                              console.error('Error purchasing credits:', error);
                              showCustomAlert('Error', 'Failed to create payment. Please try again.', { type: 'error' });
                            }
                          };

                          // Critical state management refs to prevent race conditions
                          const isListeningRef = useRef(false);
                          const shouldStopListeningRef = useRef(false);
                          const isProcessingRef = useRef(false);

                          // Voice activity detection states (declared only once)
                          const [voiceActivityTimeout, setVoiceActivityTimeout] = useState<NodeJS.Timeout | null>(null);
                          const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
                          const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
                          const [isProcessingAudio, setIsProcessingAudio] = useState(false);
                          const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
                          const [voiceDetectionActive, setVoiceDetectionActive] = useState(false);

                          // Theme management with persistence


                          useEffect(() => {
                            console.log('🔊 [DEBUG] Component mounted, setting up audio handler');
                          }, []);

                          useEffect(() => {
                            if (currentAudio) {
                              console.log('🔊 [DEBUG] Playing audio:', currentAudio.substring(0, 50) + '...');
                              const audio = new Audio(currentAudio);
                              audio.play().catch(error => {
                                console.error('❌ [DEBUG] Audio playback failed:', error);
                              });
                            }
                          }, [currentAudio]);

                          // Handle sign out with proper cleanup
                          const handleSignOut = async () => {
                            try {
                              await signOut();
                              // Redirect after sign out
                              router.push('/auth/signin');
                            } catch (error) {
                              console.error('Error signing out:', error);
                            }
                          };

                          // Redirect if not authenticated (no loading screen)
                          useEffect(() => {
                            if (!loading && !user) {
                              router.push('/auth/signin');
                            }
                          }, [loading, user, router]);

                          // User plan state and voice restrictions
                          const [currentUserPlan, setCurrentUserPlan] = useState<'free' | 'premium' | 'ultimate'>('free');
                          const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
                          const [planLoaded, setPlanLoaded] = useState(false);

                          // Fetch billing data
                          const fetchBillingData = async (forceRefresh = false) => {
                            if (!user) return;

                            try {
                              const token = await user.getIdToken();
                              const url = `/api/subscription/status${forceRefresh ? `?t=${Date.now()}` : ''}`;
                              const response = await fetch(url, {
                                method: 'GET',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                cache: forceRefresh ? 'no-store' : 'default'
                              });

                              if (response.ok) {
                                const data = await response.json();
                                console.log('💾 Updated billing data:', data);
                                setBillingData(data);
                              }
                            } catch (error) {
                              console.error('Error fetching billing data:', error);
                            }
                          };

                          // Fetch user data 
                          useEffect(() => {
                            const fetchUserData = async () => {
                              if (!user) return;

                              try {
                                const token = await user.getIdToken();
                                const response = await fetch('/api/user/profile', {
                                  method: 'GET',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                  },
                                });

                                if (response.ok) {
                                  const data = await response.json();
                                  setMessagesLeft(data.messagesLeft ?? 30);
                                  setCredits(data.credits ?? 30);
                                  setCurrentUserPlan(data.currentPlan || 'free');
                                  setPlanLoaded(true);
                                  console.log('💼 User plan loaded:', data.currentPlan || 'free');
                                }
                              } catch (error) {
                                console.error('Error fetching user data:', error);
                                // Set default values if fetch fails
                                setMessagesLeft(30);
                                setCredits(30);
                                setCurrentUserPlan('free');
                                setPlanLoaded(true);
                              }
                            };

                            fetchUserData();
                            fetchBillingData();

                            // Check if user just came from a successful payment
                            if (typeof window !== 'undefined') {
                              const urlParams = new URLSearchParams(window.location.search);
                              const fromPayment = urlParams.get('payment');

                              if (fromPayment === 'success') {
                                // Show success message and refresh data immediately
                                showCustomAlert(
                                  'Payment Successful!',
                                  'Your message credits have been added to your account.',
                                  { type: 'success' }
                                );

                                // Force immediate refresh of user data multiple times to ensure it updates
                                const refreshUserData = async () => {
                                  for (let i = 0; i =========================================================================================================================================================================== fetch('/api/voice/tts', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${await user.getIdToken()}`
                                        },
                                        body: JSON.stringify({
                                          character: currentCharacter,
                                          text: newMessage.text,
                                          requestChunk: 1
                                        })
                                      });

                                  // Get first chunk result immediately
                                  const chunk1Response = await chunk1Promise;
                                  const chunk1Data = await chunk1Response.json();

                                  if (chunk1Data.success && chunk1Data.audio) {
                                    console.log('🎵 [CHAT] Got first chunk, playing immediately');
                                    playAudio(chunk1Data.audio);

                                    // If there's a second chunk, start processing it immediately in parallel
                                    if (chunk1Data.hasSecondChunk) {
                                      // Start chunk 2 request immediately (don't wait)
                                      const chunk2Promise = fetch('/api/voice/tts', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${await user.getIdToken()}`
                                        },
                                        body: JSON.stringify({
                                          character: currentCharacter,
                                          text: newMessage.text,
                                          requestChunk: 2
                                        })
                                      });

                                      // Handle chunk 2 asynchronously
                                      chunk2Promise.then(async (chunk2Response) => {
                                        const chunk2Data = await chunk2Response.json();

                                        if (chunk2Data.success && chunk2Data.audio) {
                                          console.log('🎵 [CHAT] Got second chunk, queuing for seamless playback');
                                          // Calculate optimal timing for seamless audio transition
                                          const estimatedChunk1Duration = (chunk1Data.text?.length || 50) * 60; // ~60ms per character
                                          setTimeout(() => {
                                            playAudio(chunk2Data.audio);
                                          }, Math.max(estimatedChunk1Duration - 500, 100)); // Start slightly before chunk 1 ends
                                        }
                                      }).catch(error => {
                                        console.error('❌ [CHAT] Error getting second chunk:', error);
                                      });
                                    }
                                  }