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
                        const RecentConversationItem = ({ conversation, onClick, onDelete, currentCharacter }: {
                          conversation: any;
                          onClick: (id: string) => void;
                          onDelete: (id: string) => void;
                          currentCharacter: string | null;
                        }) => {
                          const [showMenu, setShowMenu] = useState(false);
                          const menuRef = useRef<HTMLDivElement>(null);

                          // Close menu when clicking outside
                          useEffect(() => {
                            const handleClickOutside = (event: MouseEvent) => {
                              if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
                        const CharacterCard = ({ character, onClick }: {
                          character: { id: string; name: string; description: string; };
                          onClick: () => void;
                        }) => {
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
                        const DiscoverView = ({ onSelectCharacter, loading }: {
                          onSelectCharacter: (characterId: string) => void;
                          loading: boolean;
                        }) => {
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
                          const character = searchParams?.get('character');
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
                                  for (let i = 0; i < 3; i++) {
                                    await fetchUserData();
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                  }
                                };

                                refreshUserData();

                                // Clean up URL
                                const newUrl = window.location.pathname;
                                window.history.replaceState({}, '', newUrl);
                              }
                            }
                          }, [user]);

                          // Auto-refresh user data every 2 minutes
                          useEffect(() => {
                            if (!user) return;

                            const interval = setInterval(async () => {
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
                                }
                              } catch (error) {
                                console.error('Error refreshing user data:', error);
                              }
                            }, 120000); // Check every 2 minutes

                            return () => clearInterval(interval);
                          }, [user]);

                          // Load recent conversations from localStorage
                          useEffect(() => {
                            if (!user) return;

                            const saved = localStorage.getItem(`recentConversations_${user.uid}`);
                            if (saved) {
                              try {
                                setRecentConversations(JSON.parse(saved));
                              } catch (error) {
                                console.error('Error loading recent conversations:', error);
                                setRecentConversations([]);
                              }
                            }
                          }, [user]);

                          // Add conversation to recents
                          const addToRecents = (characterId) => {
                            if (!user) return;

                            const newConversation = {
                              id: characterId,
                              name: getCharacterName(characterId),
                              image: getCharacterImage(characterId),
                              lastInteraction: new Date().toISOString(),
                            };

                            setRecentConversations(prev => {
                              // Remove existing entry for this character
                              const filtered = prev.filter(conv => conv.id !== characterId);
                              // Add new entry at the beginning
                              const updated = [newConversation, ...filtered].slice(0, 10); // Keep only 10 recent items

                              // Save to localStorage
                              localStorage.setItem(`recentConversations_${user.uid}`, JSON.stringify(updated));

                              return updated;
                            });
                          };

                          // Remove conversation from recents
                          const removeFromRecents = (characterId) => {
                            if (!user) return;

                            setRecentConversations(prev => {
                              const updated = prev.filter(conv => conv.id !== characterId);
                              localStorage.setItem(`recentConversations_${user.uid}`, JSON.stringify(updated));
                              return updated;
                            });
                          };

                          // Fetch chat history for current character with caching
                          const fetchChatHistory = async (forceRefresh = false) => {
                            if (!user || !character) {
                              console.log('Cannot fetch history: missing user or character');
                              setChatHistory([]); // Clear history when no character
                              return;
                            }

                            // Always clear history first to prevent showing wrong conversations
                            setChatHistory([]);

                            // Check cache first (valid for 10 seconds)
                            const cacheKey = `${user.uid}-${character}`;
                            const cached = historyCache.get(cacheKey);
                            const now = Date.now();

                            if (!forceRefresh && cached && (now - cached.timestamp < 10000)) {
                              console.log('Using cached history for character:', character);
                              setChatHistory(cached.data);
                              return;
                            }

                            setIsLoadingHistory(true);
                            try {
                              console.log('Fetching chat history for character:', character);
                              const token = await user.getIdToken();

                              const response = await fetch(`/api/conversation/${character}/history`, {
                                method: 'GET',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                              });

                              console.log('History fetch response status:', response.status);

                              if (response.ok) {
                                const data = await response.json();
                                console.log('Chat history data:', data);
                                const conversations = data.conversations || [];

                                // Update cache
                                setHistoryCache(prev => {
                                  const newCache = new Map(prev);
                                  newCache.set(cacheKey, {
                                    data: conversations,
                                    timestamp: now
                                  });
                                  // Keep only last 5 character caches to prevent memory bloat
                                  if (newCache.size > 5) {
                                    const oldestKey = Array.from(newCache.keys())[0];
                                    newCache.delete(oldestKey);
                                  }
                                  return newCache;
                                });

                                setChatHistory(conversations);
                              } else {
                                const errorText = await response.text();
                                console.error('Failed to fetch chat history:', response.status, errorText);
                                // Retry once if it's a compilation error
                                if (response.status === 500 && errorText.includes('compilation')) {
                                  console.log('Retrying history fetch due to compilation error...');
                                  setTimeout(() => fetchChatHistory(forceRefresh), 1000);
                                  return;
                                }
                                setChatHistory([]);
                              }
                            } catch (error) {
                              console.error('Error fetching chat history:', error);
                              setChatHistory([]);
                            } finally {
                              setIsLoadingHistory(false);
                            }
                          };

                            // Load a specific conversation
                            const loadConversation = async (conversationId) => {
                              if (!user || !character || loadingConversation === conversationId) return;

                              console.log('🔄 Loading conversation:', conversationId);
                              setLoadingConversation(conversationId);

                              try {
                                  const token = await user.getIdToken();

                                  const response = await fetch(`/api/conversation/${character}/history/${conversationId}`, {
                                      method: 'GET',
                                      headers: {
                                          'Authorization': `Bearer ${token}`,
                                          'Content-Type': 'application/json',
                                      },
                                  });

                                  console.log('📡 Load conversation response status:', response.status);

                                  if (response.ok) {
                                      const data = await response.json();
                                      console.log('📦 Loaded conversation data:', data);

                                      // Use the messages directly from the API response
                                      if (data.messages && data.messages.length > 0) {
                                          // Ensure proper message structure with correct roles
                                          const structuredMessages = data.messages.map((msg, index) => {
                                              // Ensure each message has the proper structure
                                              if (typeof msg === 'string') {
                                                  // If it's a string, assume it's alternating user/assistant
                                                  return {
                                                      role: index % 2 === 0 ? 'user' : 'assistant',
                                                      content: msg
                                                  };
                                              } else if (msg.role && msg.content) {
                                                  // If it already has proper structure, use it
                                                  return {
                                                      role: msg.role,
                                                      content: msg.content
                                                  };
                                              } else {
                                                  // Fallback: try to determine role from content or position
                                                  return {
                                                      role: index % 2 === 0 ? 'user' : 'assistant',
                                                      content: msg.content || msg.message || String(msg)
                                                  };
                                              }
                                          });

                                          // Add the initial greeting message if not present
                                          const hasGreeting = structuredMessages.some(msg => 
                                              msg.role === 'assistant' && 
                                              msg.content === getInitialMessage(character)
                                          );

                                          const messagesToSet = hasGreeting 
                                              ? structuredMessages 
                                              : [{ role: 'assistant', content: getInitialMessage(character) }, ...structuredMessages];

                                          console.log('💬 Setting structured messages:', messagesToSet.length, 'messages');
                                          console.log('💬 Message structure:', messagesToSet.map(m => ({ role: m.role, preview: m.content.substring(0, 20) + '...' })));

                                          // Clear current localStorage session when loading from history
                                          const storageKey = `chat_session_${user.uid}_${character}`;
                                          localStorage.removeItem(storageKey);

                                          // Clear current messages immediately
                                          setMessages([]);

                                          // Update session ID FIRST to prevent race conditions
                                          setSessionId(conversationId);

                                          // Then set the messages with a small delay to ensure session ID is set
                                          setTimeout(() => {
                                              setMessages(messagesToSet);
                                              console.log('✅ Messages set for conversation:', conversationId);

                                              // Save loaded conversation to localStorage for persistence with character validation
                                              try {
                                                localStorage.setItem(storageKey, JSON.stringify({
                                                  sessionId: conversationId,
                                                  messages: messagesToSet,
                                                  timestamp: Date.now(),
                                                  character: character // Ensure character is always saved
                                                }));
                                              } catch (error) {
                                                console.error('Error saving loaded conversation:', error);
                                              }
                                          }, 10);

                                      } else {
                                          console.warn('⚠️ No messages found in conversation:', conversationId);
                                          const initialMessages = [{ role: 'assistant', content: getInitialMessage(character) }];

                                          // Clear localStorage and set initial message
                                          const storageKey = `chat_session_${user.uid}_${character}`;
                                          localStorage.removeItem(storageKey);

                                          setSessionId(conversationId);
                                          setTimeout(() => {
                                              setMessages(initialMessages);

                                              // Save to localStorage
                                              try {
                                                localStorage.setItem(storageKey, JSON.stringify({
                                                  sessionId: conversationId,
                                                  messages: initialMessages,
                                                  timestamp: Date.now(),
                                                  character: character
                                                }));
                                              } catch (error) {
                                                console.error('Error saving initial conversation:', error);
                                              }
                                          }, 10);
                                      }

                                      // Hide both sidebars after loading conversation
                                      setShowHistorySidebar(false);
                                      setShowChatSidebar(false);
                                  } else {
                                      const errorText = await response.text();
                                      console.error('❌ Failed to load conversation:', response.status, errorText);
                                      showCustomAlert(
                                        'Error',
                                        'Failed to load conversation. Please try again.',
                                        { type: 'error' }
                                      );
                                  }
                              } catch (error) {
                                  console.error('💥 Error loading conversation:', error);
                                  showCustomAlert(
                                    'Error',
                                    'Error loading conversation. Please try again.',
                                    { type: 'error' }
                                  );
                              } finally {
                                  setLoadingConversation(null);
                              }
                          };

                          // Group conversations by time period
                          const groupConversationsByTime = () => {
                            const now = new Date();
                            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
                            const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
                            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                            const groups = {
                              today: [],
                              yesterday: [],
                              thisWeek: [],
                              thisMonth: [],
                              older: []
                            };

                            recentConversations.forEach(conv => {
                              const interactionDate = new Date(conv.lastInteraction);
                              const interactionDateOnly = new Date(interactionDate.getFullYear(), interactionDate.getMonth(), interactionDate.getDate());

                              if (interactionDateOnly.getTime() === today.getTime()) {
                                groups.today.push(conv);
                              } else if (interactionDateOnly.getTime() === yesterday.getTime()) {
                                groups.yesterday.push(conv);
                              } else if (interactionDate >= thisWeekStart && interactionDate < yesterday) {
                                groups.thisWeek.push(conv);
                              } else if (interactionDate >= thisMonth && interactionDate < thisWeekStart) {
                                groups.thisMonth.push(conv);
                              } else {
                                groups.older.push(conv);
                              }
                            });

                            return groups;
                          };

                          // Helper function to format time ago
                          const getTimeAgo = (timestamp) => {
                            console.log('🔍 Processing timestamp:', timestamp, 'Type:', typeof timestamp);

                            let date;

                            // Handle different timestamp formats from Firestore
                            if (timestamp?.seconds) {
                              // Firestore timestamp with seconds
                              date = new Date(timestamp.seconds * 1000);
                              console.log('📅 Firestore seconds format:', timestamp.seconds, 'Date:', date);
                            } else if (timestamp?._seconds) {
                              // Firestore timestamp with _seconds
                              date = new Date(timestamp._seconds * 1000);
                              console.log('📅 Firestore _seconds format:', timestamp._seconds, 'Date:', date);
                            } else if (timestamp?.getTime) {
                              // JavaScript Date object
                              date = timestamp;
                              console.log('📅 Date object format:', date);
                            } else if (typeof timestamp === 'string') {
                              // ISO string - improved parsing
                              date = new Date(timestamp);
                              console.log('📅 ISO string format:', timestamp, 'Parsed date:', date);
                            } else if (typeof timestamp === 'number') {
                              // Unix timestamp (handle both seconds and milliseconds)
                              date = new Date(timestamp > 1e12 ? timestamp : timestamp * 1000);
                              console.log('📅 Number format:', timestamp, 'Date:', date);
                            } else {
                              // Fallback
                              console.error('❌ Unknown timestamp format:', timestamp);
                              return 'Unknown time';
                            }

                            // Check if date is valid
                            if (!date || isNaN(date.getTime())) {
                              console.error('❌ Invalid date from timestamp:', timestamp, 'Parsed date:', date);
                              return 'Invalid date';
                            }

                            const now = new Date();
                            const diffInSeconds = Math.floor((now - date) / 1000);

                            console.log('⏰ Time difference:', diffInSeconds, 'seconds');

                            if (diffInSeconds < 60) return 'Just now';
                            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
                            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
                            if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
                            if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
                            return date.toLocaleDateString();
                          };

                          // Delete conversation from history
                          const deleteConversation = async (conversationId) => {
                            if (!user || !conversationId) return;

                            try {
                              const token = await user.getIdToken();
                              const response = await fetch(`/api/conversation/${character}/history/${conversationId}`, {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                              });

                              if (response.ok) {
                                // Remove from local state
                                setChatHistory(prev => prev.filter(conv => conv.id !== conversationId));

                                // Invalidate cache to ensure fresh data on next fetch
                                const cacheKey = `${user.uid}-${character}`;
                                setHistoryCache(prev => {
                                  const newCache = new Map(prev);
                                  newCache.delete(cacheKey);
                                  return newCache;
                                });

                                console.log('Conversation deleted successfully');
                              } else {
                                console.error('Failed to delete conversation');
                              }
                            } catch (error) {
                              console.error('Error deleting conversation:', error);
                            }
                          };

                          // Auto-scroll to latest message when messages change and save to localStorage
                          useEffect(() => {
                            // Only auto-scroll if the toggle is enabled
                            if (autoScrollEnabled && chatEndRef.current && messages.length > 0) {
                              chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
                            }

                            // Save messages to localStorage whenever they change, with strict character validation
                            if (user && character && sessionId && messages.length > 0) {
                              const storageKey = `chat_session_${user.uid}_${character}`;
                              try {
                                // Validate that we're only saving messages for the current character
                                const expectedInitial = getInitialMessage(character);
                                const hasValidInitial = messages.some(msg => 
                                  msg.role === 'assistant' && msg.content === expectedInitial
                                );

                                if (hasValidInitial) {
                                  localStorage.setItem(storageKey, JSON.stringify({
                                    sessionId,
                                    messages,
                                    timestamp: Date.now(),
                                    character: character // Include character for validation
                                  }));
                                  console.log('💾 Saved session for character:', character, 'with', messages.length, 'messages');
                                } else {
                                  console.warn('⚠️ Not saving session - missing valid initial message for character:', character);
                                }
                              } catch (error) {
                                console.error('Error saving session to localStorage:', error);
                              }
                            }
                          }, [messages, user, character, sessionId, autoScrollEnabled]);

                          // Load persisted session data on mount and character change
                          useEffect(() => {
                            if (!user || !character) {
                              if (!character) {
                                setView('discover');
                              }
                              return;
                            }

                            setView('chat');

                            // ALWAYS clear messages first when switching characters
                            console.log('🔄 Character changed to:', character, '- clearing current messages');
                            setMessages([]);
                            setSessionId('');

                            // Create a unique storage key for this user and character
                            const storageKey = `chat_session_${user.uid}_${character}`;

                            try {
                              // Try to restore previous session from localStorage
                              const savedSession = localStorage.getItem(storageKey);
                              if (savedSession) {
                                const parsed = JSON.parse(savedSession);
                                const { sessionId: savedSessionId, messages: savedMessages, timestamp, character: savedCharacter } = parsed;

                                // Validate that the saved session is EXACTLY for the current character
                                if (!savedCharacter || savedCharacter !== character) {
                                  console.log('🔄 Saved session is for different character (', savedCharacter, 'vs', character, '), clearing and creating new session');
                                  localStorage.removeItem(storageKey);
                                } else if (savedMessages && savedMessages.length > 0) {
                                  console.log('🔄 Restoring previous chat session:', savedSessionId, 'for character:', character);
                                  console.log('🔄 Restored messages count:', savedMessages.length);

                                  // Validate all messages don't contain cross-character contamination
                                  const validMessages = savedMessages.filter(msg => {
                                    if (msg.role === 'assistant') {
                                      // Check if this message could belong to the current character
                                      const expectedInitial = getInitialMessage(character);
                                      return msg.content === expectedInitial || msg.content.length > expectedInitial.length * 0.5;
                                    }
                                    return true;
                                  });

                                  if (validMessages.length !== savedMessages.length) {
                                    console.log('⚠️ Found contaminated messages, clearing session');
                                    localStorage.removeItem(storageKey);
                                  } else {
                                    // Use setTimeout to ensure state is properly cleared first
                                    setTimeout(() => {
                                      setSessionId(savedSessionId);
                                      setMessages(validMessages);
                                    }, 50);

                                    // Set up typewriter effect for restored session
                                    setPlaceholderText('');
                                    const fullText = `Message ${getCharacterName(character)}`;
                                    let i = 0;
                                    const typewriterInterval = setInterval(() => {
                                      if (i <= fullText.length) {
                                        setPlaceholderText(fullText.substring(0, i));
                                        i++;
                                      } else {
                                        clearInterval(typewriterInterval);
                                      }
                                    }, 25);

                                    return () => clearInterval(typewriterInterval);
                                  }
                                }
                              }

                              // No valid saved session found, create new one
                              console.log('🆕 Creating new chat session for character:', character);
                              const newSessionId = `${user.uid}-${character}-${Date.now()}`;
                              const initialMessages = [{ role: 'assistant', content: getInitialMessage(character) }];

                              // Use setTimeout to ensure proper state clearing and prevent race conditions
                              setTimeout(() => {
                                setSessionId(newSessionId);
                                setMessages(initialMessages);

                                // Save new session to localStorage with character validation
                                localStorage.setItem(storageKey, JSON.stringify({
                                  sessionId: newSessionId,
                                  messages: initialMessages,
                                  timestamp: Date.now(),
                                  character: character
                                }));
                                console.log('✅ New session created and saved for character:', character);
                              }, 50);

                            } catch (error) {
                              console.error('Error loading/saving session:', error);
                              // Fallback to new session
                              const newSessionId = `${user.uid}-${character}-${Date.now()}`;
                              const initialMessages = [{ role: 'assistant', content: getInitialMessage(character) }];

                              setTimeout(() => {
                                setSessionId(newSessionId);
                                setMessages(initialMessages);
                              }, 50);
                            }

                            // Set up typewriter effect
                            setPlaceholderText('');
                            const fullText = `Message ${getCharacterName(character)}`;
                            let i = 0;
                            const typewriterInterval = setInterval(() => {
                              if (i <= fullText.length) {
                                setPlaceholderText(fullText.substring(0, i));
                                i++;
                              } else {
                                clearInterval(typewriterInterval);
                              }
                            }, 25);

                            return () => clearInterval(typewriterInterval);
                          }, [user, character]);

                          // Add state to track voice response toggle
                          const [isVoiceResponseEnabled, setIsVoiceResponseEnabled] = useState(false);

                          // Initialize voice response state when plan changes, but allow user control
                          useEffect(() => {
                            if (currentUserPlan === 'premium' || currentUserPlan === 'ultimate') {
                              // For premium/ultimate users, check localStorage for their preference
                              const savedPreference = localStorage.getItem('voiceResponseEnabled');
                              if (savedPreference !== null) {
                                setIsVoiceResponseEnabled(savedPreference === 'true');
                              } else {
                                // Default to enabled for premium/ultimate users
                                setIsVoiceResponseEnabled(true);
                              }
                            } else {
                              // Free users can't use voice responses
                              setIsVoiceResponseEnabled(false);
                            }
                          }, [currentUserPlan]);

                          // Save voice response preference to localStorage when it changes
                          useEffect(() => {
                            if (currentUserPlan === 'premium' || currentUserPlan === 'ultimate') {
                              localStorage.setItem('voiceResponseEnabled', isVoiceResponseEnabled.toString());
                            }
                          }, [isVoiceResponseEnabled, currentUserPlan]);

                          const handleSendMessage = async (e) => {
                            e.preventDefault();
                            const currentInput = inputRef.current?.value || input;
                            if (currentInput.trim() === '') return;

                            // Prevent sending messages during voice processing
                            if (isProcessingRef.current || callStatus === 'processing') {
                              console.log('🔴 [DEBUG] Cannot send message - voice processing in progress');
                              return;
                            }

                            // Check if user has messages left
                            if (messagesLeft === null || messagesLeft === 0) {
                              if (messagesLeft === null) {
                                showCustomAlert(
                                  'Loading',
                                  'Please wait while we load your message count.',
                                  { type: 'info' }
                                );
                                return;
                              }
                              // Show quick purchase modal instead of alert
                              setShowCreditModal(true);
                              return;
                            }

                            const userMessage = { role: 'user', content: currentInput };
                            setMessages(prev => [...prev, userMessage]);
                            
                            // Clear both the ref and state
                            if (inputRef.current) {
                              inputRef.current.value = '';
                            }
                            setInput('');

                            // Reset textarea height and scroll state to initial state
                            if (inputRef.current) {
                              inputRef.current.style.height = '46px';
                              inputRef.current.scrollTop = 0;
                              inputRef.current.style.overflowY = 'hidden';
                            }

                            setIsLoading(true);

                            try {
                              const token = await user.getIdToken();

                              // Step 1: Get text response from chat API
                              const response = await fetch(`/api/conversation/${character}/chat`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${token}`,
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  message: currentInput,
                                  sessionId: sessionId
                                })
                              });

                              if (response.ok) {
                                const data = await response.json();
                                const aiResponseText = data.response;

                                // Check if this is the first-ever response for a free user
                                const hasSeenFirstResponseModal = localStorage.getItem('firstResponseModalShown');
                                if (currentUserPlan === 'free' && !hasSeenFirstResponseModal) {
                                  // Show the modal after 2.5 seconds to let user read the response
                                  setTimeout(() => {
                                    setShowFirstResponseVoiceModal(true);
                                    localStorage.setItem('firstResponseModalShown', 'true');
                                  }, 2500);
                                }

                                console.log('🔊 [CHAT-TTS-2CHUNK] Starting 2-chunk TTS strategy - toggle enabled:', isVoiceResponseEnabled);

                                // Step 2: Generate TTS using 2-chunk strategy if voice toggle is enabled
                                let audioData = null;
                                let secondChunkPromise = null;
                                
                                if (isVoiceResponseEnabled) {
                                  setIsGeneratingVoice(true);
                                  setVoiceGenerationError(false);
                                  try {
                                    console.log('⚡ [CHAT-TTS-2CHUNK] Requesting first chunk for immediate response...');
                                    const ttsResponse = await fetch('/api/voice/tts', {
                                      method: 'POST',
                                      headers: {
                                        'Authorization': `Bearer ${token}`,
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({
                                        character: character,
                                        text: aiResponseText,
                                        generateVoice: true // Frontend controls voice generation
                                      })
                                    });

                                    if (ttsResponse.ok) {
                                      const ttsData = await ttsResponse.json();
                                      console.log('🎯 [CHAT-TTS-2CHUNK] TTS Response:', ttsData.strategy, ttsData.isFirstChunk, ttsData.hasSecondChunk);
                                      
                                      // Check if we got a successful response
                                      if (ttsData.success && ttsData.audio) {
                                        audioData = ttsData.audio;
                                        
                                        // If this is the 2-chunk strategy and there's a second chunk
                                        if ((ttsData.strategy === '2chunk' || ttsData.strategy === '2chunk-parallel') && ttsData.hasSecondChunk) {
                                          console.log('🔄 [CHAT-TTS-2CHUNK] First chunk received, requesting second chunk immediately...');
                                          
                                          // Request second chunk immediately (no delay)
                                          secondChunkPromise = (async () => {
                                            try {
                                              console.log('📞 [CHAT-TTS-2CHUNK] Requesting second chunk...');
                                              const chunk2Response = await fetch('/api/voice/tts', {
                                                method: 'POST',
                                                headers: {
                                                  'Authorization': `Bearer ${token}`,
                                                  'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                  character: character,
                                                  text: aiResponseText,
                                                  generateVoice: true,
                                                  requestChunk: 2 // Request specifically chunk 2
                                                })
                                              });

                                              if (chunk2Response.ok) {
                                                const chunk2Data = await chunk2Response.json();
                                                if (chunk2Data.success && chunk2Data.audio) {
                                                  console.log('✅ [CHAT-TTS-2CHUNK] Second chunk received successfully');
                                                  return chunk2Data.audio;
                                                } else {
                                                  console.warn('⚠️ [CHAT-TTS-2CHUNK] Second chunk failed, returning null');
                                                  return null;
                                                }
                                              } else {
                                                console.warn('⚠️ [CHAT-TTS-2CHUNK] Second chunk request failed');
                                                return null;
                                              }
                                            } catch (error) {
                                              console.error('❌ [CHAT-TTS-2CHUNK] Second chunk error:', error);
                                              return null;
                                            }
                                          })();
                                        }

                                        console.log('✅ [CHAT-TTS-2CHUNK] Voice generation successful');
                                      } else if (ttsData.skipVoice) {
                                        console.log('🔇 [CHAT-TTS-2CHUNK] Voice generation was skipped by server');
                                      } else {
                                        console.warn('⚠️ [CHAT-TTS-2CHUNK] Voice generation failed, proceeding with text only');
                                        setVoiceGenerationError(true);
                                        // Auto-hide error after 3 seconds
                                        setTimeout(() => {
                                          setVoiceGenerationError(false);
                                        }, 3000);
                                      }
                                    } else {
                                      console.warn('⚠️ [CHAT-TTS-2CHUNK] Voice generation failed, proceeding with text only');
                                      setVoiceGenerationError(true);
                                      // Auto-hide error after 3 seconds
                                      setTimeout(() => {
                                        setVoiceGenerationError(false);
                                      }, 3000);
                                    }
                                  } catch (ttsError) {
                                    console.warn('⚠️ [CHAT-TTS-2CHUNK] Voice generation error:', ttsError);
                                    setVoiceGenerationError(true);
                                    // Auto-hide error after 3 seconds
                                    setTimeout(() => {
                                      setVoiceGenerationError(false);
                                    }, 3000);
                                  } finally {
                                    setIsGeneratingVoice(false);
                                  }
                                } else {
                                  console.log('🔇 [CHAT-TTS-2CHUNK] Voice generation disabled by toggle');
                                }

                                // Step 3: Display text response
                                const aiMessage = { role: 'assistant', content: aiResponseText };
                                setMessages(prev => {
                                  const newMessages = [...prev, aiMessage];

                                  // Step 4: Play the voice response with 2-chunk sequencing if available
                                  if (audioData) {
                                    console.log('🔊 [CHAT-TTS-2CHUNK] Playing first chunk immediately');
                                    const firstAudio = new Audio(audioData);
                                    firstAudio.volume = 1.0;

                                    // Set audio playing state for the AI message (last message in the new array)
                                    const aiMessageIndex = newMessages.length - 1;
                                    setAudioPlayingForMessage(aiMessageIndex);

                                    // Handle first chunk playback
                                    firstAudio.onended = async () => {
                                      console.log('🎵 [CHAT-TTS-2CHUNK] First chunk finished playing');

                                      // If there's a second chunk, wait for it and play it
                                      if (secondChunkPromise) {
                                        console.log('⏳ [CHAT-TTS-2CHUNK] Waiting for second chunk...');
                                        try {
                                          const secondChunkAudio = await secondChunkPromise;
                                          if (secondChunkAudio) {
                                            console.log('🔊 [CHAT-TTS-2CHUNK] Playing second chunk seamlessly');
                                            const secondAudio = new Audio(secondChunkAudio);
                                            secondAudio.volume = 1.0;

                                            secondAudio.onended = () => {
                                              console.log('🎵 [CHAT-TTS-2CHUNK] Second chunk finished - complete audio sequence done');
                                              setAudioPlayingForMessage(null);
                                            };

                                            secondAudio.onerror = () => {
                                              console.error('❌ [CHAT-TTS-2CHUNK] Second chunk playback error');
                                              setAudioPlayingForMessage(null);
                                            };

                                            secondAudio.play().catch(error => {
                                              console.error('❌ [CHAT-TTS-2CHUNK] Failed to play second chunk:', error);
                                              setAudioPlayingForMessage(null);
                                            });
                                          } else {
                                            console.log('🎵 [CHAT-TTS-2CHUNK] No second chunk available - audio complete');
                                            setAudioPlayingForMessage(null);
                                          }
                                        } catch (error) {
                                          console.error('❌ [CHAT-TTS-2CHUNK] Error waiting for second chunk:', error);
                                          setAudioPlayingForMessage(null);
                                        }
                                      } else {
                                        // No secondChunkPromise means we need to request chunk 2 from the server with retry logic
                                        console.log('🔍 [CHAT-TTS-2CHUNK] No second chunk promise, requesting chunk 2 from server with retry...');
                                        
                                        // Retry mechanism with exponential backoff
                                        const requestChunk2WithRetry = async (attempt = 1, maxAttempts = 5) => {
                                          console.log(`🔄 [CHAT-TTS-2CHUNK] Attempt ${attempt} to get chunk 2...`);
                                          
                                          try {
                                            const chunk2Response = await fetch('/api/voice/tts', {
                                              method: 'POST',
                                              headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json',
                                              },
                                              body: JSON.stringify({
                                                character: character,
                                                text: aiResponseText,
                                                generateVoice: true,
                                                requestChunk: 2
                                              })
                                            });

                                            if (chunk2Response.ok) {
                                              const chunk2Data = await chunk2Response.json();
                                              if (chunk2Data.success && chunk2Data.audio) {
                                                console.log('✅ [CHAT-TTS-2CHUNK] Second chunk received successfully on attempt', attempt);
                                                const secondAudio = new Audio(chunk2Data.audio);
                                                secondAudio.volume = 1.0;

                                                secondAudio.onended = () => {
                                                  console.log('🎵 [CHAT-TTS-2CHUNK] Second chunk finished - complete audio sequence done');
                                                  setAudioPlayingForMessage(null);
                                                };

                                                secondAudio.onerror = () => {
                                                  console.error('❌ [CHAT-TTS-2CHUNK] Second chunk playback error');
                                                  setAudioPlayingForMessage(null);
                                                };

                                                secondAudio.play().catch(error => {
                                                  console.error('❌ [CHAT-TTS-2CHUNK] Failed to play second chunk:', error);
                                                  setAudioPlayingForMessage(null);
                                                });
                                                return; // Success, exit retry loop
                                              }
                                            }

                                            // If we reach here, chunk 2 is not ready yet
                                            if (attempt < maxAttempts) {
                                              const delay = Math.min(500 * Math.pow(1.5, attempt - 1), 2000); // Exponential backoff: 500ms, 750ms, 1125ms, 1687ms, 2000ms
                                              console.log(`⏳ [CHAT-TTS-2CHUNK] Chunk 2 not ready, retrying in ${delay}ms...`);
                                              setTimeout(() => requestChunk2WithRetry(attempt + 1, maxAttempts), delay);
                                            } else {
                                              console.log('⚠️ [CHAT-TTS-2CHUNK] Max retry attempts reached, giving up on chunk 2');
                                              setAudioPlayingForMessage(null);
                                            }
                                          } catch (error) {
                                            console.error(`❌ [CHAT-TTS-2CHUNK] Error on attempt ${attempt}:`, error);
                                            if (attempt < maxAttempts) {
                                              const delay = Math.min(500 * Math.pow(1.5, attempt - 1), 2000);
                                              console.log(`🔄 [CHAT-TTS-2CHUNK] Retrying in ${delay}ms due to error...`);
                                              setTimeout(() => requestChunk2WithRetry(attempt + 1, maxAttempts), delay);
                                            } else {
                                              console.log('❌ [CHAT-TTS-2CHUNK] Max retry attempts reached after errors, giving up');
                                              setAudioPlayingForMessage(null);
                                            }
                                          }
                                        };

                                        // Start the retry sequence
                                        requestChunk2WithRetry();
                                      }
                                    };

                                    firstAudio.onerror = () => {
                                      console.error('❌ [CHAT-TTS-2CHUNK] First chunk playback error');
                                      setAudioPlayingForMessage(null);
                                    };

                                    firstAudio.play().catch(error => {
                                      console.error('❌ [CHAT-TTS-2CHUNK] Failed to play first chunk:', error);
                                      setAudioPlayingForMessage(null);
                                    });
                                  }

                                  return newMessages;
                                });
                                setMessagesLeft(data.messagesLeft);

                                // Clear voice error after 3 seconds if it was set
                                if (voiceGenerationError) {
                                  setTimeout(() => {
                                    setVoiceGenerationError(false);
                                  }, 3000);
                                }

                                // Add character to recents when user successfully sends a message
                                addToRecents(character);
                              } else {
                                let errorMessage;
                                try {
                                  const errorData = await response.json();

                                  // Handle specific error status codes
                                  if (response.status === 429) {
                                    errorMessage = { 
                                      role: 'assistant', 
                                      content: errorData.error || "I'm experiencing high demand right now. Please try again in a few moments! 🙏" 
                                    };
                                  } else if (response.status === 503) {
                                    errorMessage = { 
                                      role: 'assistant', 
                                      content: errorData.error || "I'm temporarily unavailable due to high usage. Please try again later! ⏰" 
                                    };
                                  } else {
                                    errorMessage = { 
                                      role: 'assistant', 
                                      content: errorData.error || 'Sorry, I couldn\'t generate a response right now. Please try again! 🔄' 
                                    };
                                  }
                                } catch (parseError) {
                                  // Fallback if we can't parse the error response
                                  errorMessage = { 
                                    role: 'assistant', 
                                    content: 'Sorry, I encountered an error processing your request. Please try again! 💬' 
                                  };
                                }
                                setMessages(prev => [...prev, errorMessage]);
                              }
                            } catch (error) {
                              console.error('Error sending message:', error);
                              const errorMessage = { 
                                role: 'assistant', 
                                content: 'Sorry, I couldn\'t connect to generate a response. Please check your connection and try again! 🌐' 
                              };
                              setMessages(prev => [...prev, errorMessage]);
                            } finally {
                              setIsLoading(false);
                              // Auto-focus the input field after receiving a response
                              setTimeout(() => {
                                document.getElementById('chat-input-field')?.focus();
                              }, 100);
                            }
                          };

                          const handleSelectCharacter = (char) => {
                            router.push(`/chat?character=${char}`);
                          };

                          const getInitialMessage = (char) => {
                            switch(char) {
                              case 'gojo':
                                return "Yo! The strongest sorcerer is here. What's up?";
                              case 'mikasa':
                                return "Hello. I'm Mikasa Ackerman. How can I help you?";
                              case 'megumin':
                                return "Behold! I am Megumin, the greatest arch wizard of the Crimson Demon Clan!";
                              case 'eren':
                                return "I'm Eren Yeager. I'll keep moving forward until all my enemies are destroyed.";
                              case 'tanjiro':
                                return "Hello! I'm Tanjiro Kamado. It's nice to meet you!";
                              case 'zenitsu':
                                return "Ah! H-hello there! I'm Zenitsu Agatsuma! Please don't hurt me!";
                              case 'levi':
                                return "I'm Levi. State your business.";
                              case 'nezuko':
                                return "Mmph! *nods friendly* (Hello!)";
                              case 'light':
                                return "I am Light Yagami. I will become the god of the new world.";
                              case 'lawliet':
                                return "I'm L. There's a 5% chance you're here for something interesting.";
                              case 'edward':
                                return "I'm Edward Elric, the Fullmetal Alchemist! And don't call me short!";
                              case 'spike':
                                return "Hey there. Spike Spiegel's the name. What brings you my way?";
                              case 'kenshin':
                                return "This one is called Kenshin Himura. How may this one be of service?";
                              case 'sailor':
                                return "Hi! I'm Usagi, but you can call me Sailor Moon! I fight for love and justice!";
                              case 'inuyasha':
                                return "Hmph! I'm Inuyasha. What do you want?";
                              case 'kagome':
                                return "Hello! I'm Kagome Higurashi. Nice to meet you!";
                              case 'yusuke':
                                return "Hey! Name's Yusuke Urameshi, Spirit Detective. What's the deal?";
                              case 'killua':
                                return "I'm Killua Zoldyck. This better be worth my time.";
                              case 'gon':
                                return "Hi there! I'm Gon Freecss! Want to be friends?";
                              case 'hisoka':
                                return "Ooh~ How delicious. I'm Hisoka. What fun shall we have?";
                              case 'kaneki':
                                return "I'm... I'm Kaneki Ken. Are you here to talk?";
                              case 'itachi':
                                return "I am Itachi Uchiha. What brings you before me?";
                              case 'todoroki':
                                return "I'm Shoto Todoroki. I'll use my power to become the hero I want to be.";
                              case 'bakugo':
                                return "I'm Katsuki Bakugo! I'll be the number one hero, got it?!";
                              case 'deku':
                                return "H-hello! I'm Izuku Midoriya, but you can call me Deku! I want to be a hero!";
                              case 'rimuru':
                                return "Greetings! I'm Rimuru Tempest. How can I help you today?";
                              case 'senku':
                                return "This is exhilarating! I'm Senku Ishigami. Ready for some science?";
                              case 'reigen':
                                return "I'm Reigen Arataka, the greatest psychic of the 21st century! What can I do for you?";
                              case 'mob':
                                return "Um... hello. I'm Shigeo Kageyama. People call me Mob.";
                              default:
                                return "Hello! I'm glad to meet you.";
                            }
                          };

                          const getCharacterImage = (char) => {
                            switch(char) {
                              case 'gojo':
                                return "/characters/gojo.png";
                              case 'mikasa':
                                return "/characters/mikasa.png";
                              case 'megumin':
                                return "/characters/megumin.png";
                              case 'eren':
                                return "/characters/eren.png";
                              case 'tanjiro':
                                return "/characters/tanjiro.png";
                              case 'zenitsu':
                                return "/characters/zenitsu.png";
                              case 'levi':
                                return "/characters/levi.png";
                              case 'nezuko':
                                return "/characters/nezuko.png";
                              case 'light':
                                return "/characters/light.png";
                              case 'lawliet':
                                return "/characters/lawliet.png";
                              case 'edward':
                                return "/characters/edward.png";
                              case 'spike':
                                return "/characters/spike.png";
                              case 'kenshin':
                                return "/characters/kenshin.png";
                              case 'sailor':
                                return "/characters/sailor.png";
                              case 'inuyasha':
                                return "/characters/inuyasha.png";
                              case 'kagome':
                                return "/characters/kagome.png";
                              case 'yusuke':
                                return "/characters/yusuke.png";
                              case 'killua':
                                return "/characters/killua.png";
                              case 'gon':
                                return "/characters/gon.png";
                              case 'hisoka':
                                return "/characters/hisoka.png";
                              case 'kaneki':
                                return "/characters/kaneki.png";
                              case 'itachi':
                                return "/characters/itachi.png";
                              case 'todoroki':
                                return "/characters/todoroki.png";
                              case 'bakugo':
                                return "/characters/bakugo.png";
                              case 'deku':
                                return "/characters/deku.png";
                              case 'rimuru':
                                return "/characters/rimuru.png";
                              case 'senku':
                                return "/characters/senku.png";
                              case 'reigen':
                                return "/characters/reigen.png";
                              case 'mob':
                                return "/characters/mob.png";
                              default:
                                return "/characters/gojo.png";
                            }
                          };

                          const getCharacterName = (char) => {
                            switch(char) {
                              case 'gojo':
                                return "Gojo Satoru";
                              case 'mikasa':
                                return "Mikasa Ackerman";
                              case 'megumin':
                                return "Megumin";
                              case 'eren':
                                return "Eren Yeager";
                              case 'tanjiro':
                                return "Tanjiro Kamado";
                              case 'zenitsu':
                                return "Zenitsu Agatsuma";
                              case 'levi':
                                return "Levi Ackerman";
                              case 'nezuko':
                                return "Nezuko Kamado";
                              case 'light':
                                return "Light Yagami";
                              case 'lawliet':
                                return "L (Lawliet)";
                              case 'edward':
                                return "Edward Elric";
                              case 'spike':
                                return "Spike Spiegel";
                              case 'kenshin':
                                return "Kenshin Himura";
                              case 'sailor':
                                return "Sailor Moon";
                              case 'inuyasha':
                                return "Inuyasha";
                              case 'kagome':
                                return "Kagome Higurashi";
                              case 'yusuke':
                                return "Yusuke Urameshi";
                              case 'killua':
                                return "Killua Zoldyck";
                              case 'gon':
                                return "Gon Freecss";
                              case 'hisoka':
                                return "Hisoka";
                              case 'kaneki':
                                return "Kaneki Ken";
                              case 'itachi':
                                return "Itachi Uchiha";
                              case 'todoroki':
                                return "Shoto Todoroki";
                              case 'bakugo':
                                return "Katsuki Bakugo";
                              case 'deku':
                                return "Izuku Midoriya";
                              case 'rimuru':
                                return "Rimuru Tempest";
                              case 'senku':
                                return "Senku Ishigami";
                              case 'reigen':
                                return "Reigen Arataka";
                              case 'mob':
                                return "Shigeo Kageyama";
                              default:
                                return "Character";
                            }
                          };

                          const getCharacterDescription = (char) => {
                            switch(char) {
                              case 'gojo':
                                return "Jujutsu Kaisen";
                              case 'mikasa':
                                return "Attack on Titan";
                              case 'megumin':
                                return "KonoSuba";
                              case 'eren':
                                return "Attack on Titan";
                              case 'tanjiro':
                                return "Demon Slayer";
                              case 'zenitsu':
                                return "Demon Slayer";
                              case 'levi':
                                return "Attack on Titan";
                              case 'nezuko':
                                return "Demon Slayer";
                              case 'light':
                                return "Death Note";
                              case 'lawliet':
                                return "Death Note";
                              case 'edward':
                                return "Fullmetal Alchemist: Brotherhood";
                              case 'spike':
                                return "Cowboy Bebop";
                              case 'kenshin':
                                return "Rurouni Kenshin";
                              case 'sailor':
                                return "Sailor Moon";
                              case 'inuyasha':
                                return "Inuyasha";
                              case 'kagome':
                                return "Inuyasha";
                              case 'yusuke':
                                return "Yu Yu Hakusho";
                              case 'killua':
                                return "Hunter x Hunter";
                              case 'gon':
                                return "Hunter x Hunter";
                              case 'hisoka':
                                return "Hunter x Hunter";
                              case 'kaneki':
                                return "Tokyo Ghoul";
                              case 'itachi':
                                return "Naruto";
                              case 'todoroki':
                                return "My Hero Academia";
                              case 'bakugo':
                                return "My Hero Academia";
                              case 'deku':
                                return "My Hero Academia";
                              case 'rimuru':
                                return "That Time I Got Reincarnated as a Slime";
                              case 'senku':
                                return "Dr. Stone";
                              case 'reigen':
                                return "Mob Psycho 100";
                              case 'mob':
                                return "Mob Psycho 100";
                              default:
                                return "Anime";
                            }
                          };

                          const getCharacterPersonality = (char) => {
                            switch(char) {
                              case 'gojo':
                                return "Loves to show off, playful, arrogant.";
                              case 'mikasa':
                                return "Protective, loyal, determined.";
                              case 'megumin':
                                return "Eccentric, dramatic, explosion-obsessed.";
                              case 'eren':
                                return "Passionate, determined, freedom-seeking.";
                              case 'tanjiro':
                                return "Kind-hearted, compassionate, determined.";
                              case 'zenitsu':
                                return "Anxious, cowardly, but brave when needed.";
                              case 'levi':
                                return "Stoic, disciplined, humanity's strongest.";
                              case 'nezuko':
                                return "Gentle, protective, loves her brother.";
                              case 'light':
                                return "Brilliant, calculating, god complex.";
                              case 'lawliet':
                                return "Eccentric, brilliant detective, sweet tooth.";
                              case 'edward':
                                return "Passionate alchemist, hates being called short.";
                              case 'spike':
                                return "Laid-back bounty hunter, cool demeanor.";
                              case 'kenshin':
                                return "Humble, peaceful, seeks redemption.";
                              case 'sailor':
                                return "Cheerful, optimistic, fights for love.";
                              case 'inuyasha':
                                return "Stubborn, fierce, protective half-demon.";
                              case 'kagome':
                                return "Brave, compassionate, modern girl.";
                              case 'yusuke':
                                return "Tough delinquent, strong sense of justice.";
                              case 'killua':
                                return "Quick-witted assassin, loyal friend.";
                              case 'gon':
                                return "Optimistic, pure-hearted, determined.";
                              case 'hisoka':
                                return "Mysterious, flamboyant, battle-obsessed.";
                              case 'kaneki':
                                return "Conflicted half-ghoul, gentle nature.";
                              case 'itachi':
                                return "Calm, wise, carries heavy burdens.";
                              case 'todoroki':
                                return "Reserved, powerful, learning to connect.";
                              case 'bakugo':
                                return "Explosive personality, competitive, prideful.";
                              case 'deku':
                                return "Analytical, kind-hearted, aspiring hero.";
                              case 'rimuru':
                                return "Diplomatic, kind, incredibly powerful.";
                              case 'senku':
                                return "Scientific genius, logical, enthusiastic.";
                              case 'reigen':
                                return "Charismatic con artist, good mentor.";
                              case 'mob':
                                return "Humble, powerful psychic, moral principles.";
                              default:
                                return "Friendly and helpful.";
                            }
                          };

                          const navigateTo = (newView) => {
                            if (newView === 'discover') {
                              router.push('/chat');
                            } else {
                              setView(newView);
                            }
                          };

                          // Play beep sound function
                          const playBeepSound = () => {
                            // Create a simple beep sound using Web Audio API
                            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                            const oscillator = audioContext.createOscillator();
                            const gainNode = audioContext.createGain();

                            oscillator.connect(gainNode);
                            gainNode.connect(audioContext.destination);

                            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                            oscillator.type = 'sine';

                            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

                            oscillator.start(audioContext.currentTime);
                            oscillator.stop(audioContext.currentTime + 0.3);
                          };

                          // Initialize simplified voice service
                          useEffect(() => {
                            const initVoiceService = () => {
                              try {
                                const deepgramKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
                                const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

                                if (!deepgramKey) {
                                  console.error('❌ Deepgram API key not found');
                                  return;
                                }

                                if (!geminiKey) {
                                  console.error('❌ Gemini API key not found');
                                  return;
                                }

                                const service = new SimplifiedVoiceService(deepgramKey, geminiKey);

                                service.setCallbacks({
                                  onTranscriptUpdate: (transcript: string, isFinal: boolean) => {
                                    console.log(`📝 [DEBUG] Transcript update: "${transcript}" (final: ${isFinal})`);
                                    setLiveTranscript(transcript);
                                    setLiveTranscriptDisplay(transcript);

                                    if (isFinal) {
                                      console.log('🔄 [DEBUG] Final transcript received, processing...');
                                      setCallStatus('processing');
                                      setIsProcessing(true);
                                      isProcessingRef.current = true;
                                    }
                                  },
                                  onResponse: (text: string, audioData: string, userTranscript?: string) => {
                                    console.log(`✅ [DEBUG] Got AI response: "${text}"`);

                                    // Add user message first (from provided transcript)
                                    if (userTranscript && userTranscript.trim()) {
                                      const userMessage = {
                                        role: 'user' as const,
                                        content: userTranscript.trim(),
                                      };
                                      setMessages(prev => [...prev, userMessage]);
                                      console.log('📝 [DEBUG] Added user message to chat:', userMessage.content);
                                    }

                                    // Add AI message to chat
                                    const aiMessage = {
                                      role: 'assistant' as const,
                                      content: text,
                                    };
                                    setMessages(prev => [...prev, aiMessage]);
                                    console.log('🤖 [DEBUG] Added AI message to chat:', text);

                                    // Transition to speaking
                                    console.log('🔄 [DEBUG] Transitioning to speaking status');
                                    setCallStatus('speaking');

                                    // Play audio response
                                    console.log('🔊 [DEBUG] Playing AI audio response');
                                    const audio = new Audio(audioData);

                                    audio.onloadeddata = () => {
                                      console.log('🔊 [DEBUG] AI audio loaded, duration:', audio.duration);
                                    };

                                    audio.onended = () => {
                                      console.log('🔊 [DEBUG] AI audio finished playing');
                                      console.log('🔄 [DEBUG] Transitioning back to listening');
                                      setCallStatus('listening');

                                      // Start listening again after a brief pause
                                      setTimeout(() => {
                                        console.log('🎤 [DEBUG] Restarting voice recording for next input');
                                        startVoiceRecording();
                                      }, 1000);
                                    };

                                    audio.onerror = (error) => {
                                      console.error('❌ [DEBUG] AI audio playback error:', error);
                                      console.log('🔄 [DEBUG] Fallback: Transitioning to listening after 2 seconds');
                                      setTimeout(() => {
                                        setCallStatus('listening');
                                        startVoiceRecording();
                                      }, 2000);
                                    };

                                    // Set volume and play
                                    audio.volume = 1.0;
                                    audio.play().catch(error => {
                                      console.error('❌ [DEBUG] Failed to play AI audio:', error);
                                      console.log('🔄 [DEBUG] Fallback: Transitioning to listening after 1 second');
                                      setTimeout(() => {
                                        setCallStatus('listening');
                                        startVoiceRecording();
                                      }, 1000);
                                    });

                                    // Reset states
                                    setIsProcessing(false);
                                    setIsRecording(false);
                                    setLiveTranscript('');
                                    setLiveTranscriptDisplay('');
                                    isProcessingRef.current = false;
                                  },
                                  onError: (error: string) => {
                                    console.error('❌ [DEBUG] Voice service error:', error);
                                    console.log('🔄 [DEBUG] Resetting to listening state after error');

                                    setIsProcessing(false);
                                    setIsRecording(false);
                                    setLiveTranscript('');
                                    setLiveTranscriptDisplay('');
                                    setCallStatus('listening');
                                    isProcessingRef.current = false;

                                    // Try to restart listening after error
                                    setTimeout(() => {
                                      console.log('🔄 [DEBUG] Attempting to restart voice recording after error');
                                      startVoiceRecording();
                                    }, 2000);
                                  }
                                });

                                setVoiceService(service);
                                console.log('✅ Simplified voice service initialized');
                              } catch (error) {
                                console.error('❌ Failed to initialize voice service:', error);
                              }
                            };

                            initVoiceService();
                          }, [character]);

                          // Voice recording functions
                          const startVoiceRecording = async () => {
                            if (!voiceService) {
                              console.log('🔄 [DEBUG] Voice service not ready, waiting...');
                              return;
                            }

                            if (isRecording) {
                              console.log('⚠️ [DEBUG] Already recording, skipping start');
                              return;
                            }

                            try {
                              console.log('🎤 [DEBUG] Starting voice recording...');
                              console.log('🎤 [DEBUG] Current call status:', callStatus);

                              // Clear any previous transcripts
                              setLiveTranscript('');
                              setLiveTranscriptDisplay('');
                              setIsProcessing(false);

                              // Start listening with live transcription
                              await voiceService.startListening();

                              // Set recording state after successful start
                              setIsRecording(true);

                              console.log('✅ [DEBUG] Voice recording started successfully');
                              console.log('🎤 [DEBUG] User can now speak...');
                            } catch (error) {
                              console.error('❌ [DEBUG] Failed to start voice recording:', error);
                              console.error('❌ [DEBUG] Error details:', error);
                              setIsRecording(false);
                              setCallStatus('listening'); // Keep in listening state for retry

                              // Try to restart after a brief delay
                              setTimeout(() => {
                                console.log('🔄 [DEBUG] Retrying voice recording...');
                                startVoiceRecording();
                              }, 2000);
                            }
                          };

                          const stopVoiceRecording = () => {
                            if (!voiceService) {
                              console.log('⚠️ [DEBUG] No voice service available');
                              return;
                            }

                            console.log('⏹️ [DEBUG] Stopping voice recording...');
                            console.log('🎤 [DEBUG] Current transcript before stop:', liveTranscript);

                            try {
                              voiceService.stopListening();
                              console.log('✅ [DEBUG] Voice service stopped successfully');
                            } catch (error) {
                              console.error('❌ [DEBUG] Error stopping voice service:', error);
                            }

                            // Reset recording states
                            setIsRecording(false);
                            setIsProcessing(false);
                            setLiveTranscript('');
                            setLiveTranscriptDisplay('');

                            console.log('✅ [DEBUG] Voice recording stopped and states reset');
                          };

                          const initializeVoiceDetection = async () => {
                            try {
                              console.log('🎤 [DEBUG] Requesting microphone access...');
                              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                              console.log('🎤 [DEBUG] Microphone access granted');

                              console.log('🎤 [DEBUG] Creating audio context...');
                              const context = new AudioContext();
                              const analyser = context.createAnalyser();
                              const source = context.createMediaStreamSource(stream);

                              source.connect(analyser);
                              console.log('🎤 [DEBUG] Audio nodes connected');

                              setAudioContext(context);
                              setAnalyserNode(analyser);
                              setVoiceDetectionActive(true);

                              console.log('✅ [DEBUG] Voice detection initialized successfully');
                            } catch (error) {
                              console.error('❌ [DEBUG] Voice detection failed:', error);
                              console.error('❌ [DEBUG] Error details:', error.name, error.message);

                              if (error.name === 'NotAllowedError') {
                                console.error('❌ [DEBUG] Microphone access denied by user');
                              } else if (error.name === 'NotFoundError') {
                                console.error('❌ [DEBUG] No microphone found');
                              } else if (error.name === 'NotSupportedError') {
                                console.error('❌ [DEBUG] Browser does not support getUserMedia');
                              }
                            }
                          };

                          const startVoiceCall = async () => {
                            try {
                              console.log('🎤 [DEBUG] Starting voice call...');
                              console.log('🎤 [DEBUG] Character selected:', character);

                              if (!voiceService) {
                                console.error('❌ [DEBUG] Voice service not available');
                                return;
                              }

                              if (!character) {
                                console.error('❌ [DEBUG] No character selected!');
                                return;
                              }

                              setIsCallActive(true);
                              setCallStatus('calling');
                              setShowCallInterface(true);
                              console.log('📞 [DEBUG] Call activated - status set to connecting');

                              // Set character in voice service
                              voiceService.setCharacter(character);
                              console.log('🎤 [DEBUG] Character set in voice service:', character);

                              // Use the complete start call method
                              console.log('🎤 [DEBUG] Starting complete call process...');
                              const greetingData = await voiceService.startCall();

                              if (!greetingData) {
                                console.error('❌ [DEBUG] Failed to start call');
                                throw new Error('Failed to start call');
                              }

                              console.log('🎤 [DEBUG] Call started successfully, greeting data:', greetingData);

                              // Add greeting message to chat
                              const greetingMessage = { 
                                role: 'assistant' as const, 
                                content: greetingData.text 
                              };
                              console.log('🎤 [DEBUG] Adding greeting message to chat:', greetingMessage);
                              setMessages(prev => [...prev, greetingMessage]);

                              // Transition to speaking status
                              console.log('🎤 [DEBUG] Transitioning to speaking status');
                              setCallStatus('speaking');

                              // Play greeting audio
                              console.log('🎤 [DEBUG] Playing greeting audio');
                              const audio = new Audio(greetingData.audio);

                              audio.onloadeddata = () => {
                                console.log('🎤 [DEBUG] Greeting audio loaded, duration:', audio.duration);
                              };

                              audio.onended = () => {
                                console.log('🎤 [DEBUG] Greeting audio finished playing');
                                console.log('🎤 [DEBUG] Transitioning to listening mode');
                                setCallStatus('listening');

                                // Start listening for user input immediately
                                console.log('🎤 [DEBUG] Starting voice recording for user input');
                                startVoiceRecording();
                              };

                              audio.onerror = (error) => {
                                console.error('❌ [DEBUG] Audio playback error:', error);
                                console.log('🎤 [DEBUG] Fallback: Transitioning to listening after 3 seconds');
                                setTimeout(() => {
                                  setCallStatus('listening');
                                  startVoiceRecording();
                                }, 3000);
                              };

                              // Set volume and play
                              audio.volume = 1.0;
                              audio.play().catch(error => {
                                console.error('❌ [DEBUG] Failed to play greeting audio:', error);
                                console.log('🎤 [DEBUG] Fallback: Transitioning to listening after 2 seconds');
                                setTimeout(() => {
                                  setCallStatus('listening');
                                  startVoiceRecording();
                                }, 2000);
                              });

                              console.log('🎤 [DEBUG] Voice call initialization complete');

                            } catch (error) {
                              console.error('❌ [DEBUG] Voice call failed:', error);
                              console.error('❌ [DEBUG] Error stack:', error);

                              // Reset state on error
                              setIsCallActive(false);
                              setShowCallInterface(false);
                              setCallStatus('');
                            }
                          };

                          const endCall = () => {
                            console.log('📞 [DEBUG] Ending call...');

                            // Reset all critical refs immediately
                            isProcessingRef.current = false;
                            isListeningRef.current = false;
                            shouldStopListeningRef.current = true;

                            // CRITICAL: Stop the voice service first
                            if (voiceService) {
                              console.log('🛑 [DEBUG] Stopping voice service...');
                              voiceService.stopListening();
                            }

                            // Stop voice recording
                            if (isRecording) {
                              console.log('🛑 [DEBUG] Stopping voice recording...');
                              stopVoiceRecording();
                            }

                            // Stop voice detection
                            setVoiceDetectionActive(false);

                            // Close audio context if exists
                            if (audioContext) {
                              console.log('🛑 [DEBUG] Closing audio context...');
                              audioContext.close();
                            }

                            // Clear any existing timers
                            if (silenceTimer) {
                              clearTimeout(silenceTimer);
                              setSilenceTimer(null);
                            }

                            if (voiceActivityTimeout) {
                              clearTimeout(voiceActivityTimeout);
                              setVoiceActivityTimeout(null);
                            }

                            // Reset all states
                            setIsCallActive(false);
                            setCallStatus('');
                            setIsRecording(false);
                            setIsProcessing(false);
                            setIsProcessingAudio(false);
                            setAudioContext(null);
                            setAnalyserNode(null);
                            setVoiceActivityTimeout(null);
                            setSilenceTimer(null);
                            setVoiceVolume(0);
                            setSpeechDetected(false);
                            setLiveTranscriptDisplay('');
                            setLiveTranscript('');

                            // Add call ended message
                            const endMessage = { role: 'user', content: `📞 Call ended` };
                            setMessages(prev => [...prev, endMessage]);

                            // Hide call interface with smooth transition
                            setTimeout(() => {
                              setShowCallInterface(false);
                            }, 300);

                            console.log('✅ [DEBUG] Call ended successfully - all services stopped');
                          };

                          // Upgrade Prompt Modal Component
                          const UpgradePromptModal = () => (
                            <div 
                              className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out ${
                                showUpgradePrompt ? 'opacity-100' : 'opacity-0 pointer-events-none'
                              }`}
                              onClick={() => setShowUpgradePrompt(false)}
                            >
                              <div className="flex items-center justify-center min-h-screen p-4">
                                <div 
                                  className={`bg-gradient-to-br from-gray-950/95 via-black/95 to-gray-900/95 border border-gray-800/50 rounded-3xl shadow-2xl w-full max-w-md transition-all duration-300 ease-out backdrop-blur-md ${
                                    showUpgradePrompt ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Header */}
                                  <div className="relative p-6 pb-4">
                                    <button
                                      onClick={() => setShowUpgradePrompt(false)}
                                      className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800/30"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                    <div className="text-center">
                                      {/* Voice Icon */}
                                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/15 to-purple-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                      </div>
                                      <h2 className="text-xl font-semibold text-white mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                        Premium Voice Experience
                                      </h2>
                                      <p className="text-gray-400 text-sm leading-relaxed">
                                        Unlock authentic character voices that bring your conversations to life
                                      </p>
                                    </div>
                                  </div>

                                  {/* Content */}
                                  <div className="px-6 pb-6">
                                    <div className="bg-gray-900/40 border border-gray-800/30 rounded-2xl p-4 mb-4">
                                      <ul className="text-gray-300 space-y-3">
                                        <li className="flex items-start">
                                          <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                                          <div>
                                            <span className="text-white font-medium text-sm">Character-authentic voices</span>
                                            <p className="text-gray-400 text-xs mt-0.5">Each character sounds exactly like they should</p>
                                          </div>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                                          <div>
                                            <span className="text-white font-medium text-sm">Natural speech quality</span>
                                            <p className="text-gray-400 text-xs mt-0.5">Human-like, not robotic responses</p>
                                          </div>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                                          <div className="pr-6">
                                            <span className="text-white font-medium text-sm">Immersive emotional experience</span>
                                            <p className="text-gray-400 text-xs mt-0.5">Feel every emotion as characters laugh, get angry or sad, show excitement, etc.</p>
                                          </div>
                                        </li>
                                      </ul>
                                    </div>

                                    <button
                                      onClick={() => {
                                        setShowUpgradePrompt(false);
                                        router.push('/subscription');
                                      }}
                                      className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white py-3 px-5 rounded-xl transition-all font-medium text-base shadow-lg hover:shadow-cyan-500/20"
                                    >
                                      Choose Your Plan
                                    </button>
                                    
                                    <p className="text-gray-500 text-xs mt-3 text-center">
                                      Available on Premium and Ultimate
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );

                          // First Response Voice Modal Component
                          const FirstResponseVoiceModal = () => (
                            <div 
                              className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out ${
                                showFirstResponseVoiceModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
                              }`}
                              onClick={() => setShowFirstResponseVoiceModal(false)}
                            >
                              <div className="flex items-center justify-center min-h-screen p-4">
                                <div 
                                  className={`bg-gradient-to-br from-gray-950/95 via-black/95 to-gray-900/95 border border-gray-800/50 rounded-3xl shadow-2xl w-full max-w-md transition-all duration-300 ease-out backdrop-blur-md ${
                                    showFirstResponseVoiceModal ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Gradient overlay */}
                                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 rounded-3xl pointer-events-none" />
                                  
                                  <div className="relative p-6">
                                    {/* Close button */}
                                    <button
                                      onClick={() => setShowFirstResponseVoiceModal(false)}
                                      className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800/30"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>

                                    {/* Header */}
                                    <div className="text-center mb-6">
                                      {/* Voice Icon */}
                                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/15 to-purple-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M9 12a1 1 0 102 0V9a1 1 0 10-2 0v3z" />
                                        </svg>
                                      </div>
                                      <h2 className="text-xl font-semibold text-white mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                        Want to hear {getCharacterName(character)}'s voice?
                                      </h2>
                                      <p className="text-gray-400 text-sm leading-relaxed">
                                        You just experienced the text response - now imagine hearing {getCharacterName(character)} say that in their actual voice!
                                      </p>
                                    </div>

                                    {/* Content */}
                                    <div className="bg-gray-900/40 border border-gray-800/30 rounded-2xl p-4 mb-4">
                                      <ul className="text-gray-300 space-y-3">
                                        <li className="flex items-start">
                                          <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                                          <div>
                                            <span className="text-white font-medium text-sm">Character-authentic voices</span>
                                            <p className="text-gray-400 text-xs mt-0.5">Each character sounds exactly like they should</p>
                                          </div>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                                          <div>
                                            <span className="text-white font-medium text-sm">Natural speech quality</span>
                                            <p className="text-gray-400 text-xs mt-0.5">Human-like, not robotic responses</p>
                                          </div>
                                        </li>
                                        <li className="flex items-start">
                                          <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                                          <div>
                                            <span className="text-white font-medium text-sm">Immersive emotional experience</span>
                                            <p className="text-gray-400 text-xs mt-0.5">Feel every emotion as characters laugh, get angry or sad, show excitement, etc.</p>
                                          </div>
                                        </li>
                                      </ul>
                                    </div>

                                    {/* CTA Button */}
                                    <button
                                      onClick={() => {
                                        setShowFirstResponseVoiceModal(false);
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

                          // Coming Soon Modal Component
                          const ComingSoonModal = () => (
                            <div 
                              className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out ${
                                showComingSoonModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
                              }`}
                              onClick={() => setShowComingSoonModal(false)}
                            >
                              <div className="flex items-center justify-center min-h-screen p-4">
                                <div 
                                  className={`bg-gray-950/95 border border-gray-800/50 rounded-2xl shadow-2xl w-full max-w-md transition-all duration-300 ease-out ${
                                    showComingSoonModal ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Header */}
                                  <div className="relative p-6 pb-4">
                                    <button
                                      onClick={() => setShowComingSoonModal(false)}
                                      className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800/30"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                    <div className="text-center">
                                      {/* Voice Call Icon */}
                                      <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                      </div>
                                      <h2 className="text-xl font-semibold text-white mb-2">Voice Calls Coming Soon!</h2>
                                      <p className="text-gray-400 text-sm leading-relaxed">
                                        We're working hard to bring you real-time voice conversations with your favorite anime characters. 
                                        This exciting feature will be available very soon!
                                      </p>
                                    </div>
                                  </div>

                                  {/* Content */}
                                  <div className="px-6 pb-6">
                                    <div className="bg-gray-900/50 border border-gray-800/30 rounded-xl p-4 mb-4">
                                      <h3 className="text-white font-medium text-sm mb-2">What to expect:</h3>
                                      <ul className="text-gray-300 text-sm space-y-1">
                                        <li className="flex items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          Real-time voice conversations
                                        </li>
                                        <li className="flex items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          Character-specific voices
                                        </li>
                                        <li className="flex items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                          Natural speech recognition
                                        </li>
                                      </ul>
                                    </div>

                                    <button
                                      onClick={() => setShowComingSoonModal(false)}
                                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-3 px-4 rounded-lg transition-all font-medium"
                                    >
                                      Got it!
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );

                          // Quick Purchase Component - Integrated into chat flow
                          const QuickPurchaseModal = () => (
                            <div 
                              className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-300 ease-out ${
                                showCreditModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
                              }`}
                              onClick={() => setShowCreditModal(false)}
                            >
                              <div className="flex items-center justify-center min-h-screen p-4">
                                <div 
                                  className={`bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-5xl transition-all duration-300 ease-out backdrop-blur-md ${
                                    showCreditModal ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Header */}
                                  <div className="relative p-8 pb-6 text-center">
                                    <button
                                      onClick={() => setShowCreditModal(false)}
                                      className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800/30"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                    <h2 className="text-3xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                      Out of Messages
                                    </h2>
                                    <p className="text-gray-400 text-lg">Choose a plan to continue chatting with your favorite characters</p>
                                  </div>

                                  {/* Subscription Plans Grid */}
                                  <div className="px-8 pb-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                      {/* Free Plan */}
                                      <div 
                                        onClick={() => router.push('/subscription')}
                                        className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 cursor-pointer hover:bg-gray-800/60 transition-all duration-300 hover:scale-105 flex flex-col h-full"
                                      >
                                        <div className="text-center mb-6">
                                          <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                                          <p className="text-gray-400 text-sm mb-4">Get started with basic access</p>
                                          <div className="text-4xl font-bold text-white">$0</div>
                                        </div>

                                        <div className="flex-grow">
                                          <ul className="space-y-3">
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              30 messages per day
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              All characters included
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              Text responses only
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              Basic conversations
                                            </li>
                                          </ul>
                                        </div>

                                        <div className="mt-6">
                                          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-all">
                                            Downgrade Available
                                          </button>
                                        </div>
                                      </div>

                                      {/* Premium Plan - Most Popular */}
                                      <div 
                                        onClick={() => router.push('/subscription')}
                                        className="bg-gray-800/40 border-2 border-purple-500/50 rounded-2xl p-6 cursor-pointer hover:bg-gray-800/60 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/20 flex flex-col h-full relative"
                                      >
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                          <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-4 py-2 rounded-full">
                                            MOST POPULAR
                                          </div>
                                        </div>

                                        <div className="text-center mb-6">
                                          <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                                          <p className="text-gray-400 text-sm mb-4">Enhanced experience</p>
                                          <div className="text-4xl font-bold text-white">
                                            $3.88<span className="text-lg text-gray-400">/month</span>
                                          </div>
                                        </div>

                                        <div className="flex-grow">
                                          <ul className="space-y-3">
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              200 messages per day
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              All characters included
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              Authentic character voices
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              Natural, non-robotic responses
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              Faster response times
                                            </li>
                                          </ul>
                                        </div>

                                        <div className="mt-6">
                                          <button className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg">
                                            Subscribe Now
                                          </button>
                                        </div>
                                      </div>

                                      {/* Ultimate Plan */}
                                      <div 
                                        onClick={() => router.push('/subscription')}
                                        className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 cursor-pointer hover:bg-gray-800/60 transition-all duration-300 hover:scale-105 flex flex-col h-full"
                                      >
                                        <div className="text-center mb-6">
                                          <h3 className="text-2xl font-bold text-white mb-2">Ultimate</h3>
                                          <p className="text-gray-400 text-sm mb-4">Premium unlimited access</p>
                                          <div className="text-4xl font-bold text-white">
                                            $6.88<span className="text-lg text-gray-400">/month</span>
                                          </div>
                                        </div>

                                        <div className="flex-grow">
                                          <ul className="space-y-3">
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              500 messages per day
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              All characters included
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              Premium authentic voices
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              Priority voice processing
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              Early access to new characters
                                            </li>
                                            <li className="flex items-center text-gray-300 text-sm">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                              </svg>
                                              Custom character requests
                                            </li>
                                          </ul>
                                        </div>

                                        <div className="mt-6">
                                          <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-all">
                                            Subscribe Now
                                          </button>
                                        </div>
                                      </div>

                                    </div>

                                    {/* Footer */}
                                    <div className="mt-8">
                                      <div className="flex items-center justify-center text-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        <span className="text-gray-400 text-sm">Secure PayPal</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );

                          // Settings Modal Component - Original with tabs
                          const SettingsModal = () => (
                            <div 
                              className={`fixed inset-0 z-50 bg-black/70 transition-all duration-300 ease-out ${
                                showSettingsModal ? 'opacity-100' : 'opacity-0 pointer-events-none'
                              }`}
                              onClick={() => setShowSettingsModal(false)}
                            >
                              <div className="flex items-center justify-center min-h-screen p-8">
                                <div 
                                  className={`bg-black/90 border border-gray-700/30 rounded-3xl shadow-2xl w-full max-w-2xl h-[500px] transition-all duration-300 ease-out relative ${
                                    showSettingsModal ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ overflow: 'visible' }}
                                  data-modal="settings"
                                >
                                  {/* Header */}
                                  <div className="flex items-center justify-between p-8 pb-6">
                                    <h2 className="text-2xl font-light text-white">Settings</h2>
                                    <button
                                      onClick={() => setShowSettingsModal(false)}
                                      className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800/50"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Tab Navigation */}
                                  <div className="flex border-b border-gray-700/20 px-8 mb-6">
                                    <button
                                      onClick={() => setSelectedSettingsTab('account')}
                                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                        selectedSettingsTab === 'account'
                                          ? 'text-cyan-400 border-cyan-400'
                                          : 'text-gray-400 border-transparent hover:text-white'
                                      }`}
                                    >
                                      Account
                                    </button>
                                    <button
                                      onClick={() => setSelectedSettingsTab('preferences')}
                                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                                        selectedSettingsTab === 'preferences'
                                          ? 'text-cyan-400 border-cyan-400'
                                          : 'text-gray-400 border-transparent hover:text-white'
                                      }`}
                                    >
                                      Preferences
                                    </button>
                                  </div>

                                  {/* Tab Content */}
                                  <div className="px-8 pb-8">
                                    {selectedSettingsTab === 'account' && (
                                      <div className="space-y-6">
                                        {/* User Profile Section */}
                                        <div className="flex items-center justify-between bg-gray-900/30 rounded-xl p-4 border border-gray-800/20">
                                          <div className="flex items-center space-x-4">
                                            <div className="relative">
                                              {user?.photoURL ? (
                                                <Image 
                                                  src={user.photoURL} 
                                                  alt="Profile" 
                                                  width={64} 
                                                  height={64} 
                                                  className="rounded-full object-cover"
                                                />
                                              ) : (
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xl">
                                                  {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-white font-medium text-base mb-1">
                                                {user?.displayName || 'User'}
                                              </div>
                                              <div className="text-gray-400 text-sm truncate">
                                                {user?.email || 'No email available'}
                                              </div>
                                              <div className="text-xs text-gray-500 mt-1">
                                                Member since {user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                                              </div>
                                            </div>
                                          </div>

                                          {/* Minimal Manage Account on Right */}
                                          <div className="relative">
                                            <button
                                              onClick={() => setShowAccountManagement(!showAccountManagement)}
                                              className="text-gray-400 hover:text-white text-sm transition-colors"
                                            >
                                              Manage Account
                                            </button>

                                            {/* Account Management Dropdown */}
                                            {showAccountManagement && (
                                              <>
                                                {/* Click outside overlay with higher z-index */}
                                                <div 
                                                  className="fixed inset-0 z-[60] bg-black/20"
                                                  onClick={() => setShowAccountManagement(false)}
                                                />
                                                <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900/98 border border-gray-700/50 rounded-lg shadow-2xl z-[70] backdrop-blur-md">
                                                  <div className="py-2">
                                                    <button 
                                                      onClick={async () => {
                                                        setShowAccountManagement(false);
                                                        setShowSettingsModal(false);

                                                        showCustomConfirm(
                                                          'Change Password',
                                                          'A password reset email will be sent to your email address. Do you want to continue?',
                                                          async () => {
                                                            try {
                                                              const { resetPassword } = await import('@/lib/firebase/auth');
                                                              if (user?.email) {
                                                                await resetPassword(user.email);
                                                                
                                                                // Close the confirmation modal first
                                                                setShowConfirmModal(false);
                                                                
                                                                // Then show success alert after a brief delay
                                                                setTimeout(() => {
                                                                  showCustomAlert(
                                                                    'Email Sent',
                                                                    'Password reset email sent! Please check your inbox.',
                                                                    { type: 'success' }
                                                                  );
                                                                }, 100);
                                                              } else {
                                                                setShowConfirmModal(false);
                                                                setTimeout(() => {
                                                                  showCustomAlert(
                                                                    'Error',
                                                                    'No email found for your account.',
                                                                    { type: 'error' }
                                                                  );
                                                                }, 100);
                                                              }
                                                            } catch (error) {
                                                              console.error('Error sending password reset email:', error);
                                                              setShowConfirmModal(false);
                                                              setTimeout(() => {
                                                                showCustomAlert(
                                                                  'Error',
                                                                  'Failed to send password reset email. Please try again.',
                                                                  { type: 'error' }
                                                                );
                                                              }, 100);
                                                            }
                                                          },
                                                          {
                                                            type: 'default',
                                                            confirmText: 'Send Email',
                                                            cancelText: 'Cancel'
                                                          }
                                                        );
                                                      }}
                                                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
                                                    >
                                                      Change Password
                                                    </button>
                                                    <button 
                                                      onClick={async () => {
                                                        setShowAccountManagement(false);
                                                        setShowSettingsModal(false);

                                                        showCustomConfirm(
                                                          'Privacy Settings',
                                                          `Privacy Settings Options:

                        1. Data Collection: Your conversations are stored to improve the service
                        2. Analytics: We collect usage data to enhance user experience  
                        3. Third-party Services: We use Firebase and Gemini AI for functionality

                        Would you like to delete all your conversation history?`,
                                                          async () => {
                                                            setIsDeleteHistoryLoading(true);

                                                            try {
                                                              const token = await user.getIdToken();
                                                              const response = await fetch('/api/user/privacy/delete-history', {
                                                                method: 'POST',
                                                                headers: {
                                                                  'Authorization': `Bearer ${token}`,
                                                                  'Content-Type': 'application/json',
                                                                },
                                                              });

                                                              if (response.ok) {
                                                                // Clear local data
                                                                const keys = Object.keys(localStorage);
                                                                keys.forEach(key => {
                                                                  if (key.startsWith(`chat_session_${user.uid}_`) || 
                                                                      key.startsWith(`recentConversations_${user.uid}`)) {
                                                                    localStorage.removeItem(key);
                                                                  }
                                                                });

                                                                // Clear current chat
                                                                setMessages([]);
                                                                setRecentConversations([]);
                                                                setChatHistory([]);
                                                                setHistoryCache(new Map());

                                                                // Close the confirmation modal first
                                                                setShowConfirmModal(false);

                                                                // Show success alert
                                                                setTimeout(() => {
                                                                  showCustomAlert(
                                                                    'Success',
                                                                    'All conversation history has been deleted successfully.',
                                                                    { type: 'success' }
                                                                  );
                                                                }, 300);
                                                              } else {
                                                                // Close the confirmation modal first
                                                                setShowConfirmModal(false);
                                                                
                                                                // Show error alert
                                                                setTimeout(() => {
                                                                  showCustomAlert(
                                                                    'Error',
                                                                    'Failed to delete conversation history. Please try again.',
                                                                    { type: 'error' }
                                                                  );
                                                                }, 300);
                                                              }
                                                            } catch (error) {
                                                              console.error('Error deleting conversation history:', error);
                                                              
                                                              // Close the confirmation modal first
                                                              setShowConfirmModal(false);
                                                              
                                                              // Show error alert
                                                              setTimeout(() => {
                                                                showCustomAlert(
                                                                  'Error',
                                                                  'Failed to delete conversation history. Please try again.',
                                                                  { type: 'error' }
                                                                );
                                                              }, 300);
                                                            } finally {
                                                              setIsDeleteHistoryLoading(false);
                                                            }
                                                          },
                                                          {
                                                            type: 'danger',
                                                            confirmText: isDeleteHistoryLoading ? 'Deleting...' : 'Delete History',
                                                            cancelText: 'Keep Data'
                                                          }
                                                        );
                                                      }}
                                                      className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
                                                    >
                                                      Privacy Settings
                                                    </button>
                                                    <div className="border-t border-gray-700/50 my-1"></div>
                                                    <button 
                                                      onClick={() => {
                                                        setShowAccountManagement(false);
                                                        setShowSettingsModal(false);

                                                        showCustomConfirm(
                                                          'Delete Account',
                                                          'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data including:\n\n• All conversation history\n• Subscription data\n• Personal information\n• Account settings\n\nYou will be immediately signed out and cannot recover this data.',
                                                          async () => {
                                                            try {
                                                              const token = await user.getIdToken();
                                                              const response = await fetch('/api/user/delete-account', {
                                                                method: 'POST',
                                                                headers: {
                                                                  'Authorization': `Bearer ${token}`,
                                                                  'Content-Type': 'application/json',
                                                                },
                                                              });

                                                              if (response.ok) {
                                                                // Clear all local storage
                                                                localStorage.clear();
                                                                sessionStorage.clear();

                                                                showCustomAlert(
                                                                  'Account Deleted',
                                                                  'Your account has been permanently deleted. You will be redirected to the home page.',
                                                                  { type: 'success' }
                                                                );

                                                                // Sign out and redirect after a short delay
                                                                setTimeout(async () => {
                                                                  try {
                                                                    await signOut();
                                                                    router.push('/');
                                                                  } catch (error) {
                                                                    // Even if sign out fails, redirect to home
                                                                    window.location.href = '/';
                                                                  }
                                                                }, 2000);
                                                              } else {
                                                                const errorData = await response.json();
                                                                showCustomAlert(
                                                                  'Deletion Failed',
                                                                  errorData.error || 'Failed to delete account. Please try again or contact support.',
                                                                  { type: 'error' }
                                                                );
                                                              }
                                                            } catch (error) {
                                                              console.error('Error deleting account:', error);
                                                              showCustomAlert(
                                                                'Error',
                                                                'Failed to delete account. Please check your connection and try again.',
                                                                { type: 'error' }
                                                              );
                                                            }
                                                          },
                                                          {
                                                            type: 'danger',
                                                            confirmText: 'Delete Account',
                                                            cancelText: 'Keep Account'
                                                          }
                                                        );
                                                      }}
                                                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
                                                    >
                                                      Delete Account
                                                    </button>
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        {/* Billing Section with Dropdown */}
                                        <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800/20 relative overflow-visible">
                                          <div className="flex items-center justify-between mb-4">
                                            <div className="flex-1">
                                              <div className="flex items-center space-x-3 mb-2">
                                                <div className="text-white text-sm font-medium">Current Plan</div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                  currentUserPlan === 'premium' 
                                                    ? 'bg-purple-900/30 text-purple-400' 
                                                    : currentUserPlan === 'ultimate'
                                                    ? 'bg-amber-900/30 text-amber-400'
                                                    : 'bg-gray-900/30 text-gray-400'
                                                }`}>
                                                  {currentUserPlan?.toUpperCase() || 'FREE'}
                                                </div>
                                              </div>
                                              
                                            </div>

                                            {/* Manage Billing Extension Panel */}
                                            <div className="relative" style={{ zIndex: 60 }}>
                                              <button
                                                onClick={() => setShowBillingDropdown(!showBillingDropdown)}
                                                className={`text-gray-400 hover:text-white text-sm transition-all duration-300 flex items-center ${
                                                  showBillingDropdown ? 'text-cyan-400' : ''
                                                }`}
                                              >
                                                Manage Billing
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ml-1 transition-all duration-500 ease-out ${showBillingDropdown ? 'rotate-90 scale-110' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                              </button>

                                              {/* Billing Extension Panel - Complete and Minimalist */}
                                              <div className={`absolute left-full w-80 bg-black/95 border border-gray-700/40 rounded-2xl shadow-2xl transition-all duration-500 ease-in-out ${
                                                showBillingDropdown ? 'translate-x-4 opacity-100 z-50' : 'translate-x-full opacity-0 pointer-events-none z-10'
                                              }`}
                                              style={{ 
                                                height: '500px',
                                                top: '-305px',
                                                marginLeft: '40px',
                                                transformOrigin: 'left center'
                                              }}>
                                                {/* Header */}
                                                <div className="px-5 py-4 border-b border-gray-700/30">
                                                  <div className="flex items-center justify-between">
                                                    <div className="text-lg text-white font-medium">Billing Management</div>
                                                    <button
                                                      onClick={() => setShowBillingDropdown(false)}
                                                      className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-gray-800/50"
                                                    >
                                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                </div>

                                                {/* Content */}
                                                <div className={`px-5 py-4 h-full flex flex-col transition-all duration-300 ease-in-out ${
                                                  showBillingDropdown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                                                }`} style={{ 
                                                  height: 'calc(100% - 72px)',
                                                  transitionDelay: showBillingDropdown ? '100ms' : '0ms'
                                                }}>

                                                  {/* Current Plan Info */}
                                                  <div className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-4 mb-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                      <h4 className="font-medium text-white text-sm">Current Plan</h4>
                                                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                        currentUserPlan === 'premium' 
                                                          ? 'bg-purple-900/30 text-purple-400' 
                                                          : currentUserPlan === 'ultimate'
                                                          ? 'bg-amber-900/30 text-amber-400'
                                                          : 'bg-gray-900/30 text-gray-400'
                                                      }`}>
                                                        {currentUserPlan?.toUpperCase() || 'FREE'}
                                                      </div>
                                                    </div>

                                                    <div className="text-xs text-gray-400 space-y-1">
                                                      {/* Show subscription details if user has premium/ultimate plan */}
                                                      {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && billingData?.subscription && (
                                                        <>
                                                          <p>Status: <span className={`${
                                                            billingData.subscription.cancelledAt || billingData.subscription.status === 'cancelled' 
                                                              ? 'text-yellow-400' 
                                                              : billingData.subscription.status === 'active' 
                                                              ? 'text-green-400' 
                                                              : 'text-red-400'
                                                          }`}>
                                                            {billingData.subscription.cancelledAt || billingData.subscription.status === 'cancelled'
                                                              ? 'Cancelled (Active until end date)' 
                                                              : billingData.subscription.status?.charAt(0).toUpperCase() + billingData.subscription.status?.slice(1)}
                                                          </span></p>

                                                          {billingData.subscription.nextBillingDate && (() => {
                                                            try {
                                                              let date;

                                                              // Handle different date formats
                                                              if (typeof billingData.subscription.nextBillingDate === 'string') {
                                                                date = new Date(billingData.subscription.nextBillingDate);
                                                              } else if (billingData.subscription.nextBillingDate?.seconds) {
                                                                // Firestore timestamp
                                                                date = new Date(billingData.subscription.nextBillingDate.seconds * 1000);
                                                              } else {
                                                                date = new Date(billingData.subscription.nextBillingDate);
                                                              }

                                                              if (isNaN(date.getTime())) return null;
                                                              return (
                                                                <p>
                                                                  {billingData.subscription.status === 'cancelled' || billingData.subscription.cancelledAt 
                                                                    ? 'Access until:' 
                                                                    : 'Next billing:'} {date.toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                  })}
                                                                </p>
                                                              );
                                                            } catch (error) {
                                                              console.error('Error formatting next billing date:', error);
                                                              return null;
                                                            }
                                                          })()}

                                                          {/* Always show last charged for active subscriptions */}
                                                          {!billingData.subscription.cancelledAt && billingData.subscription.status !== 'cancelled' && (() => {
                                                            try {
                                                              if (!billingData.subscription.lastChargedAt) {
                                                                return <p>Last charged: Not yet billed</p>;
                                                              }

                                                              console.log('🔍 Processing lastChargedAt:', billingData.subscription.lastChargedAt, 'Type:', typeof billingData.subscription.lastChargedAt);

                                                              let date;

                                                              // Handle different date formats with improved logic
                                                              if (billingData.subscription.lastChargedAt?.seconds) {
                                                                // Firestore timestamp with seconds
                                                                date = new Date(billingData.subscription.lastChargedAt.seconds * 1000);
                                                                console.log('📅 Firestore seconds format detected:', billingData.subscription.lastChargedAt.seconds);
                                                              } else if (billingData.subscription.lastChargedAt?._seconds) {
                                                                // Firestore timestamp with _seconds
                                                                date = new Date(billingData.subscription.lastChargedAt._seconds * 1000);
                                                                console.log('📅 Firestore _seconds format detected:', billingData.subscription.lastChargedAt._seconds);
                                                              } else if (typeof billingData.subscription.lastChargedAt === 'string') {
                                                                // ISO string format
                                                                date = new Date(billingData.subscription.lastChargedAt);
                                                                console.log('📅 ISO string format detected:', billingData.subscription.lastChargedAt);
                                                              } else if (typeof billingData.subscription.lastChargedAt === 'number') {
                                                                // Unix timestamp
                                                                date = new Date(billingData.subscription.lastChargedAt > 1e12 ? billingData.subscription.lastChargedAt : billingData.subscription.lastChargedAt * 1000);
                                                                console.log('📅 Number format detected:', billingData.subscription.lastChargedAt);
                                                              } else {
                                                                // Try direct Date constructor as fallback
                                                                date = new Date(billingData.subscription.lastChargedAt);
                                                                console.log('📅 Fallback Date constructor:', billingData.subscription.lastChargedAt);
                                                              }

                                                              console.log('📅 Parsed date:', date, 'Valid:', !isNaN(date.getTime()));

                                                              if (!date || isNaN(date.getTime())) {
                                                                console.error('❌ Invalid lastChargedAt date:', billingData.subscription.lastChargedAt, 'Parsed:', date);
                                                                return <p>Last charged: Invalid date</p>;
                                                              }

                                                              const formattedDate = date.toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                              });

                                                              console.log('✅ Formatted date:', formattedDate);

                                                              return (
                                                                <p>Last charged: {formattedDate}</p>
                                                              );
                                                            } catch (error) {
                                                              console.error('❌ Error formatting last charged date:', error);
                                                              return <p>Last charged: Error loading date</p>;
                                                            }
                                                          })()}

                                                          {(billingData.subscription.cancelledAt || billingData.subscription.status === 'cancelled') && (
                                                            <>
                                                              <p>Cancelled on: {(() => {
                                                                try {
                                                                  let date;

                                                                  if (billingData.subscription.cancelledAt) {
                                                                    if (typeof billingData.subscription.cancelledAt === 'string') {
                                                                      date = new Date(billingData.subscription.cancelledAt);
                                                                    } else if (billingData.subscription.cancelledAt?.seconds) {
                                                                      // Firestore timestamp
                                                                      date = new Date(billingData.subscription.cancelledAt.seconds * 1000);
                                                                    } else {
                                                                      date = new Date(billingData.subscription.cancelledAt);
                                                                    }
                                                                  } else {
                                                                    return 'Unknown';
                                                                  }

                                                                  if (isNaN(date.getTime())) return 'Unknown';
                                                                  return date.toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric',
                                                                  });
                                                                } catch (error) {
                                                                  console.error('Error formatting cancelled date:', error);
                                                                  return 'Unknown';
                                                                }
                                                              })()}</p>
                                                              <p className="text-yellow-400 text-xs">Your subscription will end on the access date above.</p>
                                                            </>
                                                          )}

                                                          {billingData.subscription.subscriptionId && (
                                                            <p className="text-xs text-gray-500">ID: {billingData.subscription.subscriptionId}</p>
                                                          )}
                                                        </>
                                                      )}

                                                      {/* Show billing info even for free users */}
                                                      {currentUserPlan === 'free' && (
                                                        <div className="text-xs text-gray-500 mt-2">
                                                          <p>• No payment method on file</p>
                                                          <p>• Upgrade to unlock premium features</p>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Action Buttons */}
                                                  <div className="space-y-2 flex-1">
                                                    {currentUserPlan === 'free' && (
                                                      <button
                                                        onClick={() => {
                                                          setShowBillingDropdown(false);
                                                          setShowSettingsModal(false);
                                                          router.push('/subscription');
                                                        }}
                                                        className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-2.5 px-4 rounded-lg transition-all text-sm font-medium"
                                                      >
                                                        Upgrade Plan
                                                      </button>
                                                    )}

                                                    {/* Show reactivate button for cancelled subscriptions */}
                                                    {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && 
                                                     billingData?.subscription && (billingData.subscription.cancelledAt || billingData.subscription.status === 'cancelled') && (
                                                      <button
                                                        onClick={() => {
                                                          setShowBillingDropdown(false);
                                                          setShowSettingsModal(false);
                                                          router.push('/subscription');
                                                        }}
                                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 px-4 rounded-lg transition-all text-sm"
                                                      >
                                                        Reactivate Subscription
                                                      </button>
                                                    )}

                                                    <div className="space-y-2">
                                                      {/* Only show payment management for active subscriptions */}
                                                      {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && 
                                                       billingData?.subscription && 
                                                       billingData.subscription.status === 'active' && 
                                                       !billingData.subscription.cancelledAt && (
                                                        <button
                                                          onClick={() => {
                                                            setShowBillingDropdown(false);
                                                            window.open('https://www.paypal.com/myaccount/autopay/', '_blank');
                                                          }}
                                                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg transition-all text-sm"
                                                        >
                                                          Update Payment Method
                                                        </button>
                                                      )}

                                                      {/* Plan Change Options - only show for premium/ultimate users unless cancelled */}
                                                      {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && 
                                                       !(billingData?.subscription?.cancelledAt || billingData?.subscription?.status === 'cancelled') && (
                                                        <button
                                                          onClick={() => {
                                                            setShowBillingDropdown(false);
                                                            setShowSettingsModal(false);
                                                            router.push('/subscription');
                                                          }}
                                                          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-4 rounded-lg transition-all text-sm"
                                                        >
                                                          Change Plan
                                                        </button>
                                                      )}

                                                      {/* Billing History - always show for premium/ultimate users */}
                                                      {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && (
                                                        <button
                                                          onClick={() => {
                                                            setShowBillingDropdown(false);
                                                            window.open('https://www.paypal.com/myaccount/transactions/', '_blank');
                                                          }}
                                                          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2.5 px-4 rounded-lg transition-all text-sm"
                                                        >
                                                          View Billing History
                                                        </button>
                                                      )}

                                                      {/* Cancel Subscription - Only show for active, non-cancelled subscriptions */}
                                                      {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && 
                                                       billingData?.subscription && 
                                                       billingData.subscription.status === 'active' && 
                                                       !billingData.subscription.cancelledAt && (
                                                        <button
                                                          onClick={async () => {
                                                            const confirmed = window.confirm('Are you sure you want to cancel your subscription? You will retain access until your next billing date.');
                                                            if (confirmed) {
                                                              setShowBillingDropdown(false);
                                                              setShowSettingsModal(false);

                                                              try {
                                                                const token = await user.getIdToken();
                                                                console.log('🚫 Attempting to cancel subscription...');

                                                                const response = await fetch('/api/subscription/cancel', {
                                                                  method: 'POST',
                                                                  headers: {
                                                                    'Authorization': `Bearer ${token}`,
                                                                    'Content-Type': 'application/json',
                                                                  },
                                                                });

                                                                const result = await response.json();
                                                                console.log('📊 Cancel response:', result);

                                                                if (response.ok && result.success) {
                                                                  const accessDate = result.accessUntil !== 'immediately' 
                                                                    ? new Date(result.accessUntil).toLocaleDateString()
                                                                    : 'immediately';

                                                                  // Update billing data state immediately with cancelled status
                                                                  setBillingData(prev => prev ? {
                                                                    ...prev,
                                                                    subscription: {
                                                                      ...prev.subscription,
                                                                      status: 'cancelled',
                                                                      cancelledAt: new Date().toISOString(),
                                                                      cancelReason: 'user_requested',
                                                                      nextBillingDate: result.accessUntil || prev.subscription?.nextBillingDate
                                                                    }
                                                                  } : null);

                                                                  showCustomAlert(
                                                                    'Subscription Cancelled',
                                                                    `Your subscription has been cancelled successfully! You'll retain access until ${accessDate}`,
                                                                    { type: 'success' }
                                                                  );

                                                                  // Force multiple refreshes with cache busting to ensure state consistency
                                                                  for (let i = 0; i < 3; i++) {
                                                                    await new Promise(resolve => setTimeout(resolve, 500));
                                                                    await fetchBillingData(true); // Force refresh
                                                                  }
                                                                } else {
                                                                  console.error('❌ Cancel failed:', result);
                                                                  showCustomAlert(
                                                                    'Cancellation Failed',
                                                                    result.error || 'Failed to cancel subscription. Please try again.',
                                                                    { type: 'error' }
                                                                  );
                                                                }
                                                              } catch (error) {
                                                                console.error('❌ Error cancelling subscription:', error);
                                                                showCustomAlert(
                                                                  'Error',
                                                                  'Failed to cancel subscription. Please try again.',
                                                                  { type: 'error' }
                                                                );
                                                              }
                                                            }
                                                          }}
                                                          className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-lg transition-all text-sm"
                                                        >
                                                          Cancel Subscription
                                                        </button>
                                                      )}
                                                    </div>
                                                  </div>

                                                  {/* Payment Status Warnings */}
                                                  {billingData?.subscription && billingData.subscription.cancelReason === 'payment_failed' && (
                                                    <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-3 mt-4">
                                                      <div className="flex items-center space-x-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                        </svg>
                                                        <div>
                                                          <p className="text-red-400 font-medium text-xs">Payment Failed</p>
                                                          <p className="text-red-300 text-xs">Your subscription was cancelled due to a failed payment. Please update your payment method and resubscribe.</p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Billing Panel Backdrop */}
                                              {showBillingDropdown && (
                                                <div 
                                                  className="fixed inset-0 z-40"
                                                  onClick={() => setShowBillingDropdown(false)}
                                                />
                                              )}
                                            </div>
                                          </div>

                                          {/* Plan Details */}
                                          <div className="text-sm text-gray-400 space-y-1">
                                            {currentUserPlan === 'free' && (
                                              <div className="text-xs text-gray-500">
                                                <p>• No payment method on file</p>
                                                <p>• Upgrade to unlock premium features</p>
                                              </div>
                                            )}
                                            {(currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && (
                                              <div className="text-xs text-gray-500">
                                                <p>• Active subscription</p>
                                                <p>• Auto-renewing</p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {selectedSettingsTab === 'preferences' && (
                                      <div className="space-y-6">
                                        {/* Theme Selection */}
                                        <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-800/20">
                                          <div className="mb-4">
                                            <div className="text-white text-sm font-medium mb-1">Theme</div>
                                            <div className="text-gray-400 text-xs">Choose your preferred appearance</div>
                                          </div>
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => setTheme('system')}
                                              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                theme === 'system' 
                                                  ? 'bg-cyan-600 text-white' 
                                                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                              }`}
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                              </svg>
                                              System
                                            </button>
                                            <button
                                              onClick={() => setTheme('light')}
                                              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                theme === 'light' 
                                                  ? 'bg-cyan-600 text-white' 
                                                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                              }`}
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                              </svg>
                                              Light
                                            </button>
                                            <button
                                              onClick={() => setTheme('dark')}
                                              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                theme === 'dark' 
                                                  ? 'bg-cyan-600 text-white' 
                                                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                              }`}
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                              </svg>
                                              Dark
                                            </button>
                                          </div>
                                        </div>

                                        {/* Other Preferences */}
                                        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-800/20">
                                          <div>
                                            <div className="text-gray-900 dark:text-white text-sm font-medium">Auto-scroll</div>
                                            <div className="text-gray-600 dark:text-gray-400 text-xs">
                                              {autoScrollEnabled ? 'Automatically scroll to new messages' : 'Manual scrolling to new messages'}
                                            </div>
                                          </div>
                                          <div className="relative">
                                            <input 
                                              type="checkbox" 
                                              checked={autoScrollEnabled} 
                                              onChange={(e) => setAutoScrollEnabled(e.target.checked)}
                                              className="sr-only" 
                                              id="auto-scroll" 
                                            />
                                            <label 
                                              htmlFor="auto-scroll" 
                                              className={`block w-10 h-6 rounded-full cursor-pointer relative transition-colors duration-200 ${
                                                autoScrollEnabled 
                                                  ? 'bg-cyan-600 hover:bg-cyan-700' 
                                                  : 'bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600'
                                              }`}
                                            >
                                              <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                                                autoScrollEnabled ? 'transform translate-x-3' : ''
                                              }`}></span>
                                            </label>
                                          </div>
                                        </div>

                                        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-200 dark:border-gray-800/20">
                                          <div>
                                            <div className="flex items-center space-x-2 mb-1">
                                              <div className="text-gray-900 dark:text-white text-sm font-medium">Voice Response</div>
                                              {currentUserPlan === 'free' && (
                                                <div className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[10px] rounded-full font-medium">
                                                  Premium
                                                </div>
                                              )}
                                            </div>
                                            <div className="text-gray-600 dark:text-gray-400 text-xs">
                                              {currentUserPlan === 'free' 
                                                ? 'Get voice responses with Premium plan' 
                                                : isVoiceResponseEnabled 
                                                ? 'Character voice responses enabled'
                                                : 'Character voice responses disabled'
                                              }
                                            </div>
                                          </div>
                                          <div className="relative">
                                            <input 
                                              type="checkbox" 
                                              checked={isVoiceResponseEnabled} 
                                              onChange={(e) => {
                                                if (currentUserPlan === 'free') {
                                                  setShowSettingsModal(false);
                                                  setShowUpgradePrompt(true);
                                                } else {
                                                  setIsVoiceResponseEnabled(e.target.checked);
                                                }
                                              }}
                                              className="sr-only" 
                                              id="voice-response" 
                                              disabled={currentUserPlan === 'free'}
                                            />
                                            <label 
                                              htmlFor="voice-response" 
                                              className={`block w-10 h-6 rounded-full cursor-pointer relative transition-colors duration-200 ${
                                                currentUserPlan === 'free' 
                                                  ? 'bg-gray-600 cursor-not-allowed' 
                                                  : isVoiceResponseEnabled 
                                                  ? 'bg-cyan-600' 
                                                  : 'bg-gray-700'
                                              }`}
                                              onClick={() => {
                                                if (currentUserPlan === 'free') {
                                                  setShowSettingsModal(false);
                                                  setShowUpgradePrompt(true);
                                                } else {
                                                  setIsVoiceResponseEnabled(!isVoiceResponseEnabled);
                                                }
                                              }}
                                            >
                                              <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                                                isVoiceResponseEnabled ? 'transform translate-x-3' : ''
                                              }`}></span>
                                            </label>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );

                          // Call Interface Component
                          const CallInterface = () => (
                            <div className={`fixed inset-0 z-50 bg-gradient-to-br from-gray-950 via-black to-gray-950 transition-all duration-500 ease-in-out ${
                              showCallInterface ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95 pointer-events-none'
                            }`}>
                              <div className="flex flex-col h-screen justify-center items-center">
                                {/* Character Profile Section */}
                                <div className="flex flex-col items-center justify-center">
                                  <div className="text-center mb-12">
                                    <div className="relative w-40 h-40 mx-auto mb-6">
                                      <Image 
                                        src={getCharacterImage(character)}
                                        alt={getCharacterName(character)}
                                        fill
                                        className="rounded-full object-cover"
                                      />
                                      {/* Subtle glow when speaking */}
                                      {callStatus === 'speaking' && (
                                        <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-pulse shadow-2xl shadow-cyan-400/20"></div>
                                      )}
                                    </div>
                                    <h2 className="text-3xl font-light text-white mb-2">{getCharacterName(character)}</h2>
                                    <p className="text-gray-400 text-sm font-light">{getCharacterDescription(character)}</p>
                                  </div>

                                  {/* Call Status Display */}
                                  <div className="mb-16">
                                    <div className="flex flex-col items-center space-y-3">
                                      {callStatus === 'calling' && (
                                        <div className="text-blue-400 text-sm font-light">
                                          Connecting
                                          <span className="inline-block ml-0.5">
                                            <span className="inline-block opacity-0 animate-[fadeInOut_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}>.</span>
                                            <span className="inline-block opacity-0 animate-[fadeInOut_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.8s' }}>.</span>
                                            <span className="inline-block opacity-0 animate-[fadeInOut_2.5s_ease-in-out_infinite]" style={{ animationDelay: '1.6s' }}>.</span>
                                          </span>
                                        </div>
                                      )}
                                      {callStatus === 'speaking' && (
                                        <span className="text-green-400 text-sm font-light animate-pulse">🔊 Speaking</span>
                                      )}
                                      {callStatus === 'listening' && (
                                        <span className="text-cyan-400 text-sm font-light animate-pulse">🎤 Listening</span>
                                      )}
                                      {callStatus === 'processing' && (
                                        <span className="text-amber-400 text-sm font-light">
                                          🤔 Processing
                                          <span className="inline-block ml-1">
                                            <span className="inline-block opacity-0 animate-[fadeInOut_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}>.</span>
                                            <span className="inline-block opacity-0 animate-[fadeInOut_1.5s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}>.</span>
                                            <span className="inline-block opacity-0 animate-[fadeInOut_1.5s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}>.</span>
                                          </span>
                                        </span>
                                      )}



                                      {/* Live transcript display during listening */}
                                      {callStatus === 'listening' && liveTranscriptDisplay && (
                                        <div className="mt-4 p-3 bg-black/40 border border-cyan-500/30 rounded-lg max-w-sm text-center">
                                          <div className="text-cyan-300 text-sm italic">
                                            "{liveTranscriptDisplay}"
                                          </div>
                                          <div className="text-xs text-cyan-400/60 mt-1">
                                            Live transcription...
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>



                                  {/* End Call Button */}
                                  <button
                                    onClick={endCall}
                                    className="bg-red-500/80 hover:bg-red-500 text-white rounded-full p-5 transition-allduration-200 shadow-lg hover:shadow-red-500/20 flex items-center justify-center group"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-135 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );

                          // Don't show blank screen - always render the UI structure
                          // Authentication redirect happens in useEffect background

                          return (
                            <div className="flex h-screen bg-black text-white overflow-hidden" suppressHydrationWarning>
                              {/* Custom Modals */}
                              <ConfirmModal
                                isOpen={showConfirmModal}
                                onClose={() => setShowConfirmModal(false)}
                                onConfirm={modalConfig.onConfirm}
                                title={modalConfig.title}
                                message={modalConfig.message}
                                confirmText={modalConfig.confirmText}
                                cancelText={modalConfig.cancelText}
                                type={modalConfig.type}
                              />

                              <AlertModal
                                isOpen={showAlertModal}
                                onClose={() => setShowAlertModal(false)}
                                title={alertConfig.title}
                                message={alertConfig.message}
                                buttonText={alertConfig.buttonText}
                                type={alertConfig.type}
                              />

                              {/* Quick Purchase Modal */}
                              <QuickPurchaseModal />

                              {/* Upgrade Prompt Modal */}
                              <UpgradePromptModal />

                              {/* First Response Voice Modal */}
                              <FirstResponseVoiceModal />

                              {/* Coming Soon Modal */}
                              <ComingSoonModal />

                              {/* Settings Modal Overlay */}
                              <SettingsModal />

                              {/* Call Interface Overlay */}
                              <CallInterface />

                              {/* Left Sidebar - Minimalist */}
                              <div className="w-72 border-r border-gray-900/50 flex flex-col bg-black">
                                <div className="p-4 border-b border-gray-900/50">
                                  <h1 
                                    className="text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity tracking-wide" 
                                    style={{ fontFamily: 'Shocka Serif', fontWeight: 700 }}
                                    onClick={() => router.push('/')}
                                  >
                                    <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                                      RealAnima AI
                                    </span>
                                  </h1>
                                </div>

                                <div className="px-4 py-3">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-500">
                                      Messages left: <span className="text-cyan-400 font-medium">
                                        {messagesLeft === null ? '...' : messagesLeft}
                                      </span>
                                    </p>
                                    <div className="relative group">
                                      <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        className="h-5 w-5 text-gray-500 cursor-pointer" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                        Your messages reset every day
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="p-3 flex-1 flex flex-col min-h-0">
                                  {/* Menu Items */}
                                  <div className="space-y-1 mb-4 flex-shrink-0">
                                    <div 
                                      className={`flex items-center p-3 rounded-md transition-colors cursor-pointer ${view === 'discover' ? 'bg-cyan-950/30 text-cyan-400' : 'text-white hover:bg-gray-950/60'}`}
                                      onClick={() => navigateTo('discover')}
                                    >
                                      <Image 
                                        src={theme === 'light' ? "/icons/discover-light.png" : "/icons/discover-dark.png"}
                                        alt="Discover" 
                                        width={32} 
                                        height={32} 
                                        className="mr-2.5" 
                                      />
                                      <span className="text-base font-medium">Discover</span>
                                    </div>
                                  </div>

                                  {/* Search Box */}
                                  <div className="mb-4 flex-shrink-0">
                                    <div className="relative">
                                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                      </div>
                                      <input 
                                        type="text" 
                                        placeholder="Search" 
                                        className="w-full bg-gray-950/50 text-white text-sm rounded-md pl-10 pr-3 py-2.5 border border-gray-800/30 focus:outline-none focus:border-cyan-500/50"
                                      />
                                    </div>
                                  </div>

                                  {/* Recent Conversations - Scrollable Container */}
                                  <div className="flex-1 overflow-y-auto min-h-0 mb-4 pr-1" style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none'
                                  }}>
                                    {(() => {
                                      const grouped = groupConversationsByTime();
                                      return (
                                        <div className="space-y-3">
                                          {grouped.today.length > 0 && (
                                            <div>
                                              <h3 className="text-xs text-gray-500 mb-1">Today</h3>
                                              <div className="space-y-1">
                                                {grouped.today.map((conv) => (
                                                  <RecentConversationItem
                                                    key={conv.id}
                                                    conversation={conv}
                                                    onClick={handleSelectCharacter}
                                                    onDelete={removeFromRecents}
                                                    currentCharacter={character}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {grouped.yesterday.length > 0 && (
                                            <div>
                                              <h3 className="text-xs text-gray-500 mb-1">Yesterday</h3>
                                              <div className="space-y-1">
                                                {grouped.yesterday.map((conv) => (
                                                  <RecentConversationItem
                                                    key={conv.id}
                                                    conversation={conv}
                                                    onClick={handleSelectCharacter}
                                                    onDelete={removeFromRecents}
                                                    currentCharacter={character}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {grouped.thisWeek.length > 0 && (
                                            <div>
                                              <h3 className="text-xs text-gray-500 mb-1">This Week</h3>
                                              <div className="space-y-1">
                                                {grouped.thisWeek.map((conv) => (
                                                  <RecentConversationItem
                                                    key={conv.id}
                                                    conversation={conv}
                                                    onClick={handleSelectCharacter}
                                                    onDelete={removeFromRecents}
                                                    currentCharacter={character}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {grouped.thisMonth.length > 0 && (
                                            <div>
                                              <h3 className="text-xs text-gray-500 mb-1">This Month</h3>
                                              <div className="space-y-1">
                                                {grouped.thisMonth.map((conv) => (
                                                  <RecentConversationItem
                                                    key={conv.id}
                                                    conversation={conv}
                                                    onClick={handleSelectCharacter}
                                                    onDelete={removeFromRecents}
                                                    currentCharacter={character}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {grouped.older.length > 0 && (
                                            <div>
                                              <h3 className="text-xs text-gray-500 mb-1">A While Ago</h3>
                                              <div className="space-y-1">
                                                {grouped.older.map((conv) => (
                                                  <RecentConversationItem
                                                    key={conv.id}
                                                    conversation={conv}
                                                    onClick={handleSelectCharacter}
                                                    onDelete={removeFromRecents}
                                                    currentCharacter={character}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Footer Section */}
                                  <div className="flex-shrink-0">
                                    {/* Terms and Policy */}
                                    <div className="flex justify-center space-x-2 text-[10px] text-gray-500 mb-3">
                                      <a href="#" className="hover:text-gray-300">Privacy</a>
                                      <span>•</span>
                                      <a href="#" className="hover:text-gray-300">Terms</a>
                                    </div>

                                    {/* Upgrade Plan Button */}
                                    <button 
                                      onClick={() => router.push('/subscription')}
                                      className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 text-white rounded-md py-2.5 font-semibold text-sm hover:from-purple-700 hover:to-cyan-700 transition-colors mb-3 shadow-lg"
                                    >
                                      Upgrade Plan
                                    </button>

                                    {/* User Account - Dropdown Toggle */}
                                    <div className="relative">
                                      <button 
                                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                                        className="flex items-center justify-between p-1.5 rounded-md cursor-pointer hover:bg-gray-950/60 transition-colors w-full"
                                      >
                                        <div className="flex items-center">
                                          {user?.photoURL ? (
                                            <Image 
                                              src={user.photoURL} 
                                              alt="User" 
                                              width={24} 
                                              height={24} 
                                              className="rounded-full"
                                            />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-white font-medium text-xs">
                                              {user?.displayName?.[0] || 'U'}
                                            </div>
                                          )}
                                          <span className="ml-2 text-xs text-white truncate max-w-[140px]">
                                            {user?.displayName || 'User'}
                                          </span>
                                        </div>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                      </button>

                                      {/* Dropdown Menu */}
                                      {showUserDropdown && (
                                        <>
                                          <div className="absolute bottom-full left-0 mb-1.5 w-full bg-gray-900/95 rounded-md shadow-xl overflow-hidden z-50 border border-gray-700/50 backdrop-blur-sm">
                                            <div className="py-1">
                                              <button 
                                                onClick={() => {
                                                  setShowSettingsModal(true);
                                                  setShowUserDropdown(false);
                                                }}
                                                className="flex items-center w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Settings
                                              </button>
                                              <button 
                                                onClick={handleSignOut}
                                                className="flex items-center w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Logout
                                              </button>
                                            </div>
                                          </div>
                                          {/* Click outside overlay */}
                                          <div 
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowUserDropdown(false)}
                                          />
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Voice generation error notification - Fixed at top of chat area */}
                              {voiceGenerationError && (
                                <div className="fixed top-4 left-72 right-0 flex justify-center z-50 animate-fadeIn pointer-events-none">
                                  <div className="bg-gray-900/95 border border-gray-700/50 rounded-lg px-4 py-2 shadow-lg backdrop-blur-sm">
                                    <div className="text-gray-300 text-sm text-center flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 8.5c-.77.833-.192 2.5 1.732 2.5z" />
                                      </svg>
                                      Couldn't generate voice
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Main Content Area */}
                              {view === 'discover' ? (
                                <DiscoverView onSelectCharacter={handleSelectCharacter} loading={loading} />
                              ) : (
                                // Main Chat Area - Minimalist
                                <div className="flex-1 flex flex-col relative">
                                  {/* Character Header - border made invisible */}
                                  <div className="p-2 mt-3 flex justify-between items-center bg-black relative">
                                    <button 
                                      className="flex items-center text-gray-300 hover:text-white text-xs bg-gray-950/50 px-2 py-1 rounded-md transition-colors"
                                      onClick={() => navigateTo('discover')}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                      </svg>
                                      Back
                                    </button>

                                    {/* Centered Character Info */}
                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center">
                                      <div className="relative w-10 h-10">
                                          <Image 
                                            src={getCharacterImage(character)}
                                            alt={getCharacterName(character)}
                                            fill
                                            className="rounded-full object-cover"
                                          />
                                        </div>
                                      <div className="ml-3">
                                        <h2 className="font-medium text-base">{getCharacterName(character)}</h2>
                                        <p className="text-sm text-gray-400">{getCharacterDescription(character)}</p>
                                      </div>
                                    </div>

                                    {/* Right Side Controls */}
                                    <div className="flex items-center space-x-2">
                                      {/* Voice Response Toggle */}
                                      <div className="flex items-center">
                                        <span className={`text-xs font-medium mr-2 ${currentUserPlan === 'free' ? 'text-gray-500' : 'text-gray-300'}`}>
                                          Voice Response
                                        </span>
                                        <div className="relative">
                                          <input 
                                            type="checkbox" 
                                            checked={isVoiceResponseEnabled} 
                                            onChange={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              if (currentUserPlan === 'free') {
                                                setShowUpgradePrompt(true);
                                              } else {
                                                setIsVoiceResponseEnabled(e.target.checked);
                                              }
                                            }}
                                            className="sr-only" 
                                            id="voice-response-header"
                                          />
                                          <div 
                                            className={`block w-8 h-5 rounded-full cursor-pointer relative transition-colors duration-200 ${
                                              currentUserPlan === 'free' 
                                                ? 'bg-gray-600' 
                                                : isVoiceResponseEnabled 
                                                ? 'bg-cyan-600' 
                                                : 'bg-gray-700'
                                            }`}
                                            title={currentUserPlan === 'free' ? 'Voice responses require Premium plan' : isVoiceResponseEnabled ? 'Voice responses enabled' : 'Voice responses disabled'}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              if (currentUserPlan === 'free') {
                                                setShowUpgradePrompt(true);
                                              } else {
                                                setIsVoiceResponseEnabled(!isVoiceResponseEnabled);
                                              }
                                            }}
                                          >
                                            <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                                              isVoiceResponseEnabled ? 'transform translate-x-3' : ''
                                            }`}></span>
                                          </div>
                                        </div>
                                        <div className="ml-2">
                                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${currentUserPlan === 'free' ? 'text-gray-500' : isVoiceResponseEnabled ? 'text-cyan-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M9 12a1 1 0 102 0V9a1 1 0 10-2 0v3z" />
                                          </svg>
                                        </div>
                                      </div>

                                      <button 
                                        className="flex items-center text-gray-300 hover:text-white text-xs bg-gray-950/50 px-2 py-1 rounded-md transition-colors"
                                        onClick={() => setShowChatSidebar(!showChatSidebar)}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                                        </svg>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Chat Sidebar */}
                                  <div className={`absolute top-0 right-0 h-full w-80 bg-black98 backdrop-blur-md border-l border-gray-700/50 z-40 transform transition-all duration-300 ease-out shadow-2xl ${
                                    showChatSidebar ? 'translate-x-0' : 'translate-x-full'
                                  }`}>
                                    <div className="flex flex-col h-full">


                                      {/* Character Info Section */}
                                      <div className="p-3 border-b border-gray-700/20">
                                        <div className="flex items-center space-x-3">
                                          <div className="relative w-12 h-12">
                                            <Image 
                                              src={getCharacterImage(character)}
                                              alt={getCharacterName(character)}
                                              fill
                                              className="rounded-full object-cover"
                                            />
                                          </div>
                                          <div>
                                            <h4 className="text-white font-medium text-sm">{getCharacterName(character)}</h4>
                                            <p className="text-gray-400 text-xs">{getCharacterDescription(character)}</p>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Sidebar Content */}
                                      <div className="flex-1 p-3">
                                        <div className="space-y-2">
                                          {/* New Chat */}
                                          <button 
                                            onClick={() => {
                                              // Generate new session ID with timestamp for uniqueness
                                              const newSessionId = `${user.uid}-${character}-${Date.now()}`;
                                              const initialMessages = [{ role: 'assistant', content: getInitialMessage(character) }];

                                              // Clear any existing chat cache
                                              if (voiceService) {
                                                try {
                                                  const { GeminiService } = require('@/services/GeminiService');
                                                  const geminiService = new GeminiService(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
                                                  geminiService.clearChat(sessionId);
                                                  console.log('🧹 Cleared previous chat cache for new session');
                                                } catch (error) {
                                                  console.warn('⚠️ Could not clear chat cache:', error);
                                                }
                                              }

                                              // Clear localStorage session for this specific character
                                              const storageKey = `chat_session_${user.uid}_${character}`;
                                              localStorage.removeItem(storageKey);

                                              // Clear current messages immediately
                                              setMessages([]);

                                              // Set new session data
                                              setSessionId(newSessionId);

                                              // Use timeout to ensure clean state transition
                                              setTimeout(() => {
                                                setMessages(initialMessages);
                                                setShowChatSidebar(false);

                                                // Save new session to localStorage with character validation
                                                try {
                                                  localStorage.setItem(storageKey, JSON.stringify({
                                                    sessionId: newSessionId,
                                                    messages: initialMessages,
                                                    timestamp: Date.now(),
                                                    character: character // Always include character for validation
                                                  }));
                                                } catch (error) {
                                                  console.error('Error saving new session:', error);
                                                }

                                                console.log('✅ Started new chat session:', newSessionId, 'for character:', character);
                                              }, 10);
                                            }}
                                            className="w-full flex items-center p-3 text-gray-400 hover:text-white hover:bg-gray-800/20 rounded-md transition-colors text-left"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                            </svg>
                                            <span className="text-sm">New chat</span>
                                          </button>

                                          {/* History */}
                                          <button 
                                            onClick={() => {
                                              setShowChatSidebar(false);
                                              setShowHistorySidebar(true);
                                              // Always fetch fresh data when opening history
                                              fetchChatHistory();
                                            }}
                                            className="w-full flex items-center p-3 text-gray-400 hover:text-white hover:bg-gray-800/20 rounded-md transition-colors text-left"
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-sm">History</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* History Sidebar - Overlays Chat Sidebar */}
                                  <div className={`absolute top-0 right-0 h-full w-80 bg-black/98 backdrop-blur-md border-l border-gray-700/50 z-50 shadow-2xl ${
                                    showHistorySidebar ? 'translate-x-0' : 'translate-x-full'
                                  }`}>
                                    <div className="flex flex-col h-full">
                                      {/* History Header */}
                                      <div className="p-4 mt-2 border-b border-gray-700/40 bg-gray-900/20">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center">
                                            <button 
                                              onClick={() => {
                                                setShowHistorySidebar(false);
                                                setShowChatSidebar(true);
                                              }}
                                              className="text-gray-400 hover:text-white transition-colors p-1.5 mr-3 rounded-md hover:bg-gray-800/50"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                              </svg>
                                            </button>
                                            <h3 className="text-white font-medium text-base">History</h3>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <button
                                              onClick={() => fetchChatHistory(true)}
                                              disabled={isLoadingHistory}
                                              className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-gray-800/50"
                                              title="Refresh history"
                                            >
                                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isLoadingHistory ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                              </svg>
                                            </button>
                                            <div className="text-xs text-gray-500">
                                              {chatHistory.length} conversations
                                            </div>
                                          </div>
                                        </div>
                                      </div>

                                      {/* History Content */}
                                      <div className="flex-1 p-4 overflow-y-auto">
                                        <div className="space-y-4">
                                          {isLoadingHistory ? (
                                            <div className="text-center py-12">
                                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mx-auto mb-3"></div>
                                              <p className="text-gray-400 text-sm">Loading chat history...</p>
                                            </div>
                                          ) : chatHistory.length > 0 ? (
                                            <div className="space-y-4">
                                              {chatHistory.map((conversation, index) => {
                                                const timeAgo = getTimeAgo(conversation.timestamp);
                                                const messageCount = conversation.messageCount || 1;

                                                return (
                                                  <div key={conversation.id || index} className="group">
                                                    {loadingConversation === conversation.id ? (
                                                        <div className="text-center py-6">
                                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto mb-2"></div>
                                                            <p className="text-gray-400 text-sm">Loading conversation...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="relative border border-gray-700/20 rounded-lg p-3 hover:border-gray-600/30 hover:bg-gray-800/10 transition-all">
                                                            {/* Header with time and message count */}
                                                            <div className="flex items-center justify-between mb-3">
                                                              <div className="flex items-center space-x-2">
                                                                <div className="text-xs text-cyan-400 font-medium">{timeAgo}</div>
                                                                <div className="text-xs text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full">
                                                                  {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                                                                </div>
                                                              </div>
                                                              <button
                                                                onClick={() => deleteConversation(conversation.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-all"
                                                                title="Delete conversation"
                                                              >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                              </button>
                                                            </div>

                                                            {/* Conversation preview - clickable */}
                                                            <button
                                                                onClick={() => loadConversation(conversation.id)}
                                                                className="w-full text-left"
                                                                disabled={loadingConversation !== null}
                                                            >
                                                                {conversation.message && (
                                                                    <div className="bg-gray-800/30 border border-gray-700/20 rounded-lg p-3">
                                                                        <div className="text-sm text-gray-200 leading-relaxed line-clamp-2">
                                                                            <span className="text-gray-300 font-medium">You:</span> {conversation.message.length > 80 
                                                                                ? conversation.message.substring(0, 80) + '...' 
                                                                                : conversation.message}
                                                                        </div>
                                                                        {conversation.response && (
                                                                            <div className="text-sm text-gray-200 leading-relaxed line-clamp-2 mt-2">
                                                                                <span className="text-cyan-400 font-medium">{getCharacterName(character)}:</span> {conversation.response.length > 80 
                                                                                    ? conversation.response.substring(0, 80) + '...' 
                                                                                    : conversation.response}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                        </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="text-center py-16">
                                              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                              </div>
                                              <h4 className="text-gray-400 text-base font-medium mb-2">No chat history</h4>
                                              <p className="text-gray-600 text-sm">Start a conversation to see your chat history here</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Overlay */}
                                  {(showChatSidebar || showHistorySidebar) && (
                                    <div 
                                      className={`absolute inset-0 z-30 ${
                                        document.body.classList.contains('light') 
                                          ? 'bg-white/30' 
                                          : 'bg-black/50'
                                      }`}
                                      onClick={() => {
                                        setShowChatSidebar(false);
                                        setShowHistorySidebar(false);
                                      }}
                                    />
                                  )}



                                  {/* Character Description - border made invisible */}
                                  <div className="text-center py-2 bg-black">
                                    <p className="text-sm text-gray-400">{getCharacterPersonality(character)}</p>
                                  </div>

                                  {/* Chat Messages */}
                                  <div 
                                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-black auto-hide-scrollbar" 
                                    onScroll={(e) => {
                                      const target = e.currentTarget;
                                      if (!target.classList.contains('scrolling')) {
                                        target.classList.add('scrolling');

                                        // Clear previous timeout if exists
                                        if (target.dataset.scrollTimeout) {
                                          clearTimeout(parseInt(target.dataset.scrollTimeout));
                                        }

                                        // Set new timeout
                                        const timeout = setTimeout(() => {
                                          target.classList.remove('scrolling');
                                        }, 1000); // Hide scrollbar after 1 second of inactivity

                                        target.dataset.scrollTimeout = timeout.toString();
                                      }
                                    }}
                                  >
                                    <div className="px-6 md:px-10 lg:px-16 max-w-3xl mx-auto space-y-4">
                                      {messages.map((msg, index) => (
                                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                                          <div className={`flex items-start ${msg.role === 'user' ? 'max-w-[70%]' : ''}`}>
                                            {msg.role === 'assistant' && (
                                              <div className="relative w-8 h-8 mr-2">
                                                <Image 
                                                  src={getCharacterImage(character)}
                                                  alt={getCharacterName(character)}
                                                  fill
                                                  className="rounded-full object-cover"
                                                />
                                              </div>
                                            )}
                                            <div className={`rounded-lg px-2.5 py-2 ${
                                              msg.role === 'user' 
                                                ? 'bg-cyan-500/20 text-white min-w-[40px]' 
                                                : 'bg-gray-300/10 max-w-[70%]'
                                            }`}>
                                              <div className={`${msg.role === 'user' ? 'text-white text-sm' : 'text-gray-200 text-sm'}`}>
                                                {msg.content}
                                              </div>
                                            </div>
                                            
                                            {/* Audio Playing Indicator - Only show for AI messages when audio is playing and user has premium/ultimate */}
                                            {msg.role === 'assistant' && 
                                             audioPlayingForMessage === index && 
                                             (currentUserPlan === 'premium' || currentUserPlan === 'ultimate') && 
                                             isVoiceResponseEnabled && (
                                              <div className="ml-2 flex items-end pb-1">
                                                <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center animate-pulse">
                                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                                                  </svg>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      {(isLoading || isGeneratingVoice) && (
                                        <div className="flex justify-start animate-fadeIn">
                                          <div className="flex items-start">
                                            <div className="relative w-8 h-8 mr-2">
                                              <Image 
                                                src={getCharacterImage(character)}
                                                alt={getCharacterName(character)}
                                                fill
                                                className="rounded-full object-cover"
                                              />
                                            </div>
                                            <div className="text-gray-500 text-sm italic flex items-center">
                                              {getCharacterName(character)} is thinking
                                              <span className="ml-2">
                                                <div className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                      {/* Live transcription display - shows on user side only while listening and not in call interface */}
                                      {isCallActive && liveTranscriptDisplay && callStatus === 'listening' && !showCallInterface && (
                                        <div className="flex justify-end animate-fadeIn">
                                          <div className="flex items-start max-w-[70%]">
                                            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-3">
                                              <div className="text-cyan-300 text-sm italic">
                                                {liveTranscriptDisplay}...
                                              </div>
                                              <div className="text-xs text-cyan-400/60 mt-1">
                                                Recording
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      <div ref={chatEndRef} />
                                    </div>
                                  </div>

                                  {/* Message Input */}
                                  <div className="p-3 bg-black border-t border-transparent">
                                    <div className="relative mb-2 px-6 md:px-10 lg:px-16 max-w-3xl mx-auto">
                                      <div className="flex items-center">
                                        <div className={`relative ${input.length > 50 ? 'rounded-xl' : 'rounded-full'} bg-black border border-gray-800/50 overflow-hidden w-full flex items-center transition-all duration-200`}>
                                          <div className="flex-grow relative w-full">
                                            <textarea
                                              ref={inputRef}
                                              defaultValue={input}
                                              onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement;
                                                
                                                // Update React state with debouncing to reduce re-renders
                                                if (updateTimeoutRef.current) {
                                                  clearTimeout(updateTimeoutRef.current);
                                                }
                                                updateTimeoutRef.current = setTimeout(() => {
                                                  setInput(target.value);
                                                }, 300);
                                                
                                                // Handle height adjustment immediately without blocking
                                                requestAnimationFrame(() => {
                                                  target.style.height = 'auto';
                                                  const newHeight = Math.min(target.scrollHeight, 150);
                                                  target.style.height = newHeight + 'px';
                                                  target.style.overflowY = target.scrollHeight > 150 ? 'scroll' : 'hidden';
                                                });
                                              }}
                                              placeholder={placeholderText}
                                              className="w-full bg-transparent text-white py-3 text-sm focus:outline-none min-h-[46px] max-h-[150px] resize-none placeholder-typing scrollbar-custom box-border leading-relaxed break-words"
                                              id="chat-input-field"
                                              rows={1}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                  e.preventDefault();
                                                  const currentValue = (e.target as HTMLTextAreaElement).value;
                                                  if (currentValue.trim() !== '' && !isLoading && !isGeneratingVoice) {
                                                    handleSendMessage(e);
                                                  }
                                                }
                                              }}
                                              style={{
                                                paddingLeft: '16px', 
                                                paddingRight: '16px',
                                                textIndent: '0',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                overflowY: 'hidden'
                                              }}
                                            />
                                          </div>
                                          <div className="flex-shrink-0 pr-2">
                                            <button
                                              type="button"
                                              onClick={handleSendMessage}
                                              className="rounded-full p-2 transition-colors flex items-center justify-center shadow-sm bg-cyan-600 hover:bg-cyan-700 text-white"
                                              disabled={isLoading || isGeneratingVoice}
                                            >
                                              {isLoading || isGeneratingVoice ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                                              ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                                </svg>
                                              )}
                                            </button>
                                          </div>
                                        </div>
                                         <div className="relative">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowComingSoonModal(true);
                                            }}
                                            className={`rounded-full ml-2 transition-colors shadow-md flex items-center justify-center flex-shrink-0 relative ${
                                              isCallActive
                                                ? 'bg-gray-600 cursor-not-allowed opacity-50'
                                                : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                                            }`}
                                            disabled={isCallActive}
                                            style={{
                                              height: '46px',
                                              width: '46px',
                                              alignSelf: 'center'
                                            }}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex justify-center">
                                      <p className="text-[10px] text-gray-500">AI responses are for entertainment purposes. Not to be relied upon as fact or advice.</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );


                        }