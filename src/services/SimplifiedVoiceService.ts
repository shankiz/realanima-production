import { CHARACTER_CONTEXTS } from './CharacterContexts';

export class SimplifiedVoiceService {
  // Live transcription properties (merged from LiveTranscriptionService)
  private ws: WebSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private isConnected: boolean = false;

  // Original properties
  private isListening: boolean = false;
  private currentTranscript: string = '';
  private finalTranscript: string = '';
  private lastProcessedTranscript: string = '';
  private lastProcessTime: number = 0;
  private deepgramApiKey: string;
  private geminiApiKey: string;
  private currentCharacter: string = 'gojo';
  private silenceTimer: NodeJS.Timeout | null = null;

  // Callbacks
  private onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  private onResponse?: (text: string, audio: string, userTranscript?: string) => void;
  private onError?: (error: string) => void;

  constructor(deepgramApiKey: string, geminiApiKey: string) {
    this.deepgramApiKey = deepgramApiKey;
    this.geminiApiKey = geminiApiKey;
  }

  private async getAuthToken(): Promise<string> {
    // Get Firebase auth token for API requests
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      }
    } catch (error) {
      console.warn('⚠️ [AUTH] Could not get auth token:', error);
    }
    return '';
  }

  setCallbacks(callbacks: {
    onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
    onResponse?: (text: string, audio: string, userTranscript?: string) => void;
    onError?: (error: string) => void;
  }) {
    this.onTranscriptUpdate = callbacks.onTranscriptUpdate;
    this.onResponse = callbacks.onResponse;
    this.onError = callbacks.onError;
  }

  setCharacter(character: string) {
    this.currentCharacter = character;
  }

  // Merged live transcription connection method
  private async connectToDeepgram(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('🔗 [DEBUG] Already connected to Deepgram');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `wss://api.deepgram.com/v1/listen?model=nova-2&language=en-US&smart_format=true&interim_results=true&endpointing=true&utterance_end_ms=2000&vad_turnoff=1000&punctuate=true&diarize=false&no_delay=true&filler_words=true&multichannel=false&keywords=Megumi:3&keywords=Gojo:3&keywords=Nobara:3&keywords=Yuji:3&keywords=Itadori:3&keywords=Satoru:2&keywords=Fushiguro:2&keywords=Kugisaki:2`;

        this.ws = new WebSocket(wsUrl, ['token', this.deepgramApiKey]);

        this.ws.onopen = () => {
          console.log('🎤 [DEBUG] Deepgram live transcription connected');
          this.isConnected = true;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'Results') {
              const transcript = data.channel?.alternatives?.[0]?.transcript;
              const isFinal = data.is_final;
              const speechFinal = data.speech_final;

              if (transcript && transcript.trim()) {
                console.log(`📝 [DEBUG] Live transcript: "${transcript}" (final: ${isFinal}, speech_final: ${speechFinal})`);

                // Handle interim results - accumulate and build complete transcript
                if (!isFinal && !speechFinal) {
                  if (!this.isProcessingTranscript) {
                    // Accumulate the transcript properly - Deepgram sends the complete current phrase
                    this.currentTranscript = transcript.trim();
                    this.onTranscriptUpdate?.(this.currentTranscript, false);

                    // Clear any existing silence timer
                    if (this.silenceTimer) {
                      clearTimeout(this.silenceTimer);
                      this.silenceTimer = null;
                    }

                    // Set up silence timer for auto-processing after user stops speaking
                    if (this.currentTranscript.length > 3 && 
                        !this.isSimilarToLastProcessed(this.currentTranscript) &&
                        Date.now() - this.lastProcessTime > 1500) {
                      this.silenceTimer = setTimeout(() => {
                        const currentClean = this.currentTranscript.trim();
                        if (currentClean && 
                            !this.isProcessingTranscript && 
                            !this.isSimilarToLastProcessed(currentClean) &&
                            currentClean.length > 3) {
                          console.log('🔄 [DEBUG] Auto-processing after silence:', currentClean);
                          this.processFinalTranscript(currentClean);
                        }
                      }, 1500);
                    }
                  }
                }

                // Handle final results - prioritize is_final over speech_final
                if ((isFinal || speechFinal) && !this.isProcessingTranscript) {
                  const cleanTranscript = transcript.trim();

                  // Clear silence timer since we have a final result
                  if (this.silenceTimer) {
                    clearTimeout(this.silenceTimer);
                    this.silenceTimer = null;
                    console.log('✅ [DEBUG] Cleared silence timer for final result');
                  }

                  // Process if substantial, unique, and sufficient time has passed
                  if (cleanTranscript.length > 3 && 
                      !this.isSimilarToLastProcessed(cleanTranscript) &&
                      Date.now() - this.lastProcessTime > 1000) {
                    console.log(`🔄 [DEBUG] Processing ${isFinal ? 'is_final' : 'speech_final'} transcript:`, cleanTranscript);
                    this.processFinalTranscript(cleanTranscript);
                  } else {
                    console.log('⚠️ [DEBUG] Final transcript skipped (duplicate/too recent/too short):', cleanTranscript);
                  }
                }
              }
            }
          } catch (error) {
            console.error('❌ [DEBUG] Error parsing live transcription:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ [DEBUG] Live transcription error:', error);
          this.isConnected = false;
          this.onError?.('Transcription failed');
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 [DEBUG] Live transcription closed');
          this.isConnected = false;
        };

      } catch (error) {
        console.error('❌ [DEBUG] Failed to connect to live transcription:', error);
        this.onError?.('Failed to connect to transcription service');
        reject(error);
      }
    });
  }

  // Merged audio capture method
  private async startAudioCapture(): Promise<void> {
    if (!this.isConnected) {
      await this.connectToDeepgram();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });

      this.audioContext = new AudioContext({ sampleRate: 16000 });
      const source = this.audioContext.createMediaStreamSource(stream);

      // Create audio recorder for sending to Deepgram
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(event.data);
        }
      };

      this.mediaRecorder.start(250); // Send audio chunks every 250ms
      console.log('🎤 [DEBUG] Live transcription started');

    } catch (error) {
      console.error('❌ [DEBUG] Error starting live transcription:', error);
      this.onError?.('Failed to access microphone');
    }
  }

  async startListening() {
    if (this.isListening) return;

    console.log('🎤 [SIMPLIFIED] Starting live transcription...');

    try {
      // Start the integrated live transcription
      await this.startAudioCapture();

      this.isListening = true;
      console.log('✅ [SIMPLIFIED] Live transcription started');

    } catch (error) {
      console.error('❌ [SIMPLIFIED] Failed to start listening:', error);
      this.onError?.('Failed to start voice recognition');
    }
  }

  stopListening() {
    console.log('⏹️ [SIMPLIFIED] Stopping transcription...');

    // Stop media recorder
    if (this.mediaRecorder) {
      try {
        if (this.mediaRecorder.state !== 'inactive') {
          this.mediaRecorder.stop();
        }
        this.mediaRecorder = null;
        console.log('✅ [SIMPLIFIED] Media recorder stopped');
      } catch (error) {
        console.error('❌ [SIMPLIFIED] Error stopping media recorder:', error);
        this.mediaRecorder = null;
      }
    }

    // Close audio context
    if (this.audioContext) {
      try {
        if (this.audioContext.state !== 'closed') {
          this.audioContext.close();
        }
        this.audioContext = null;
        console.log('✅ [SIMPLIFIED] Audio context closed');
      } catch (error) {
        console.error('❌ [SIMPLIFIED] Error closing audio context:', error);
        this.audioContext = null;
      }
    }

    // Close WebSocket
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          this.ws.close();
        }
        this.ws = null;
        console.log('✅ [SIMPLIFIED] WebSocket closed');
      } catch (error) {
        console.error('❌ [SIMPLIFIED] Error closing WebSocket:', error);
        this.ws = null;
      }
    }

    // Reset all states
    this.isListening = false;
    this.isConnected = false;
    this.isProcessingTranscript = false;
    this.currentTranscript = '';
    this.finalTranscript = '';
    this.lastProcessedTranscript = '';
    this.lastProcessTime = 0;

    // Clear silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
      console.log('✅ [SIMPLIFIED] Silence timer cleared');
    }

    console.log('✅ [SIMPLIFIED] All transcription services stopped completely');
  }

  private isProcessingTranscript: boolean = false;

  // Helper method to check if transcript is similar to last processed one
  private isSimilarToLastProcessed(transcript: string): boolean {
    if (!this.lastProcessedTranscript) return false;

    const cleanTranscript = transcript.toLowerCase().trim();
    const cleanLast = this.lastProcessedTranscript.toLowerCase().trim();

    // Simple exact match check for speed
    return cleanTranscript === cleanLast;
  }

  private async processFinalTranscript(transcript: string) {
    const cleanTranscript = transcript.trim();

    if (!cleanTranscript || cleanTranscript.length < 3) {
      console.log('⚠️ [SIMPLIFIED] Transcript too short:', cleanTranscript);
      return;
    }

    // Enhanced duplicate prevention
    const currentTime = Date.now();
    const timeSinceLastProcess = currentTime - this.lastProcessTime;

    if (this.isProcessingTranscript) {
      console.log('⚠️ [SIMPLIFIED] Already processing, ignoring:', cleanTranscript);
      return;
    }

    // Use similarity check helper
    if (this.isSimilarToLastProcessed(cleanTranscript)) {
      console.log('⚠️ [SIMPLIFIED] Similar transcript ignored:', cleanTranscript);
      return;
    }

    if (timeSinceLastProcess < 1000) {
      console.log('⚠️ [SIMPLIFIED] Processing too soon, waiting:', cleanTranscript);
      return;
    }

    // Set processing flag and mark transcript as processed IMMEDIATELY
    this.isProcessingTranscript = true;
    this.lastProcessedTranscript = cleanTranscript;
    this.lastProcessTime = currentTime;

    // Clear silence timer since we're processing now
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
      console.log('✅ [SIMPLIFIED] Cleared silence timer during processing');
    }

    // Update UI to show final transcript
    this.onTranscriptUpdate?.(cleanTranscript, true);

    try {
      console.log('🔄 [SIMPLIFIED] Processing final transcript:', cleanTranscript);

      // Step 1: Get Gemini response
      const aiResponse = await this.getGeminiResponse(cleanTranscript);

      if (!aiResponse) {
        this.onError?.('Failed to get AI response');
        return;
      }

      // Step 2: Generate TTS audio
      const audioResponse = await this.generateTTS(aiResponse);

      if (!audioResponse) {
        this.onError?.('Failed to generate audio');
        return;
      }

      // Return response with the captured transcript
      this.onResponse?.(aiResponse, audioResponse, cleanTranscript);

    } catch (error) {
      console.error('❌ [SIMPLIFIED] Processing error:', error);
      this.onError?.('Failed to process voice input');
    } finally {
      // Reset processing flag after a small delay to prevent rapid successive calls
      setTimeout(() => {
        this.isProcessingTranscript = false;
      }, 200);
    }
  }

  private async getGeminiResponse(message: string): Promise<string | null> {
    try {
      const characterContext = CHARACTER_CONTEXTS[this.currentCharacter] || CHARACTER_CONTEXTS['gojo'];
      const prompt = `${characterContext}\n\nThis is a VOICE CALL - use the special voice call rules with (laugh), (breath), (break), etc. Give complete responses in 1-2 full sentences. Always finish your thoughts completely - don't cut off mid-sentence.`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=' + this.geminiApiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${prompt}\n\nUser: ${message}`
            }]
          }],
          generationConfig: {
            maxOutputTokens: 80, // Further reduced for faster generation
            temperature: 0.7,
            topP: 0.8,
            topK: 15, // Further reduced for speed
            candidateCount: 1,
            stopSequences: []
          },
          safetySettings: [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"}
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!aiResponse) {
        throw new Error('No response from Gemini');
      }

      return aiResponse;

    } catch (error) {
      console.error('❌ [GEMINI] Error:', error);
      return null;
    }
  }

  private async generateTTS(text: string): Promise<string | null> {
    try {
      console.log('🔊 [TTS] Generating audio for:', text.substring(0, 50) + '...');

      // Create a controller for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

      try {
        const response = await fetch('/api/voice/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAuthToken()}`
          },
          body: JSON.stringify({
            character: this.currentCharacter,
            text: text,
            generateVoice: true // Voice service always wants voice generation
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [TTS] API error:', response.status, errorText);
          throw new Error(`TTS API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        if (!data.success || !data.audio) {
          console.error('❌ [TTS] Invalid response:', data);
          throw new Error('TTS generation failed - invalid response');
        }

        console.log('✅ [TTS] Audio generated successfully');
        return data.audio;

      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('TTS request timed out');
        }
        throw fetchError;
      }

    } catch (error) {
      console.error('❌ [TTS] Error:', error);

      // More specific error messages for user
      let errorMessage = 'Voice generation failed';
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          errorMessage = 'Voice generation timed out - please try again';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error - please check your connection';
        } else if (error.message.includes('server error')) {
          errorMessage = 'Voice server temporarily unavailable';
        }
      }

      this.onError?.(errorMessage);
      return null;
    }
  }

  // Method for generating character greeting with integrated start call logic
  async generateGreeting(): Promise<{ text: string; audio: string } | null> {
    try {
      console.log('🎤 [SIMPLIFIED] Generating greeting for character:', this.currentCharacter);

      // Use Gemini to generate dynamic greeting
      const greetingText = await this.getGeminiResponse("I'm calling you");
      if (!greetingText) {
        console.error('❌ [SIMPLIFIED] Failed to generate greeting text');
        return null;
      }

      console.log('🎤 [SIMPLIFIED] Greeting text:', greetingText);

      const audio = await this.generateTTS(greetingText);
      if (!audio) {
        console.error('❌ [SIMPLIFIED] Failed to generate greeting audio');
        return null;
      }

      console.log('✅ [SIMPLIFIED] Greeting generated successfully');
      return { text: greetingText, audio };
    } catch (error) {
      console.error('❌ [SIMPLIFIED] Greeting error:', error);
      return null;
    }
  }

  // Complete start call method that handles everything
  async startCall(): Promise<{ text: string; audio: string } | null> {
    try {
      console.log('📞 [SIMPLIFIED] Starting complete call process...');

      // Step 1: Connect to Deepgram for live transcription
      await this.connectToDeepgram();
      console.log('✅ [SIMPLIFIED] Connected to live transcription');

      // Step 2: Generate and return greeting
      const greeting = await this.generateGreeting();
      if (!greeting) {
        throw new Error('Failed to generate greeting');
      }

      console.log('✅ [SIMPLIFIED] Call started successfully');
      return greeting;

    } catch (error) {
      console.error('❌ [SIMPLIFIED] Start call error:', error);
      return null;
    }
  }

  // Method for getting AI response to user message (used by voice route)
  async get_response(character: string, message: string): Promise<string | null> {
    try {
      console.log('🔄 [SIMPLIFIED] Getting response for character:', character, 'message:', message);
      
      // Set the character context
      this.setCharacter(character);
      
      // Get AI response using existing method
      const response = await this.getGeminiResponse(message);
      
      if (!response) {
        console.error('❌ [SIMPLIFIED] Failed to get AI response');
        return null;
      }

      console.log('✅ [SIMPLIFIED] Generated response:', response);
      return response;

    } catch (error) {
      console.error('❌ [SIMPLIFIED] get_response error:', error);
      return null;
    }
  }
}