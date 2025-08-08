
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export class GeminiService {
  private static instance: GeminiService;
  private genAI: GoogleGenerativeAI;
  private apiKey: string;
  private modelCache: Record<string, any> = {};
  private chatCache: Record<string, any> = {};

  private constructor(apiKey: string) {
    if (!apiKey) {
      console.warn('Warning: No Gemini API key provided');
    }
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  static getInstance(apiKey: string): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService(apiKey);
      console.log('🏗️ [GEMINI] Created singleton GeminiService instance');
    }
    return GeminiService.instance;
  }

  async getOrCreateModel(character: string) {
    if (!this.modelCache[character]) {
      try {
        this.modelCache[character] = this.genAI.getGenerativeModel({
          model: "gemini-2.5-flash-lite",
          generationConfig: {
            maxOutputTokens: 150,
            temperature: 0.8,
            topP: 0.9,
            topK: 20
          },
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
          ]
        });
      } catch (error) {
        console.error(`Error creating model for ${character}:`, error);
        throw new Error(`Failed to initialize Gemini model: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return this.modelCache[character];
  }

  async getOrCreateChat(sessionId: string, character: string, characterContext: string) {
    const cacheKey = `${sessionId}-${character}`;

    // If chat session already exists in memory, return it immediately
    if (this.chatCache[cacheKey]) {
      console.log(`⚡ [GEMINI] CACHE HIT! Using existing ChatSession for ${cacheKey} - INSTANT response!`);
      return this.chatCache[cacheKey];
    }

    try {
      const model = await this.getOrCreateModel(character);

      // Minimal initial setup - let ChatSession handle everything else
      let chatHistory = [
        {
          role: "user",
          parts: [{text: `Roleplay as ${character}. Context: ${characterContext}. Keep responses under 150 tokens.`}]
        },
        {
          role: "model",
          parts: [{text: `Got it! I'm ${character}.`}]
        }
      ];

      // Note: For now, we're not loading previous conversation history to keep it simple
      // The ChatSession will maintain conversation memory during the session lifetime
      console.log(`📚 [GEMINI] Creating fresh ChatSession for ${cacheKey} - conversation memory starts now`);

      // Create the chat session and store it in memory
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.8,
          topK: 20,
          topP: 0.9
        }
      });

      this.chatCache[cacheKey] = chat;
      console.log(`✨ [GEMINI] Created NEW ChatSession for ${cacheKey} with ${chatHistory.length} initial history items`);
      return chat;

    } catch (error) {
      console.error(`Error creating chat for ${sessionId}-${character}:`, error);
      throw new Error(`Failed to initialize chat session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async sendMessage(sessionId: string, character: string, characterContext: string, message: string) {
    try {
      console.log(`🚀 [GEMINI] Generating response for ${character} using ChatSession`);

      // Get or create the chat session (history loaded automatically by the service when needed)
      const chat = await this.getOrCreateChat(sessionId, character, characterContext);

      // Simply send the new message - ChatSession automatically remembers everything
      const result = await chat.sendMessage(message);
      const response = result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Gemini');
      }

      console.log(`✅ [GEMINI] Response generated using persistent ChatSession with automatic conversation memory!`);
      return this.cleanResponse(text);

    } catch (error) {
      console.error('❌ [GEMINI] Error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  cleanResponse(text: string) {
    // Remove any markdown artifacts
    let cleaned = text;

    // Remove code blocks
    cleaned = cleaned.replace(/```[\s\S]*?```/g, '');

    // Remove any references to the character's name or "as [character]"
    cleaned = cleaned.replace(/As \w+,\s*/gi, '');

    // Remove any "*" or "**" markdown styling
    cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
    cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');

    // Remove any AI self-references
    cleaned = cleaned.replace(/As an AI language model,/gi, '');
    cleaned = cleaned.replace(/I'm an AI/gi, '');

    // Remove extra whitespace and newlines
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return cleaned || "Sorry, I couldn't generate a proper response.";
  }

  clearChat(sessionId: string) {
    const keysToDelete = Object.keys(this.chatCache).filter(key => key.startsWith(`${sessionId}-`));
    keysToDelete.forEach(key => {
      console.log(`🗑️ Clearing ChatSession: ${key}`);
      delete this.chatCache[key];
    });
  }
}
