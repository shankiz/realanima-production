import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { GeminiService } from '@/services/GeminiService';
import { CHARACTER_CONTEXTS } from '@/services/CharacterContexts';

export async function POST(req: NextRequest, { params }: { params: Promise<{ character: string }> }) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!adminAuth) {
      console.error('[CHAT] Firebase Admin not initialized');
      return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 500 });
    }

    if (!adminDb) {
      console.error('[CHAT] Firestore not initialized');
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { message, sessionId } = await req.json();
    const resolvedParams = await params;
    const character = resolvedParams.character;

    console.log(`💬 [CHAT] Processing message for ${character}: "${message.substring(0, 50)}..."`);

    if (!message || !character) {
      return NextResponse.json({ error: 'Message and character are required' }, { status: 400 });
    }

    // Get user data
    const userDoc = await adminDb.collection('users').doc(uid).get();
    let userData;

    if (!userDoc.exists) {
      // Create new user with default values
      userData = {
        email: decodedToken.email || '',
        displayName: decodedToken.name || '',
        messagesLeft: 30, // Use correct free tier limit
        currentPlan: 'free',
        lastMessageReset: new Date()
      };

      await adminDb.collection('users').doc(uid).set(userData);
    } else {
      userData = userDoc.data();
    }

    // Check if user has messages left (unless they have unlimited)
    if (userData?.currentPlan !== 'ultimate' && (userData?.messagesLeft || 0) <= 0) {
      return NextResponse.json({ error: 'No messages left. Please upgrade or wait for daily reset.' }, { status: 403 });
    }

    // Get character context
    const characterContext = CHARACTER_CONTEXTS[character as keyof typeof CHARACTER_CONTEXTS];
    if (!characterContext) {
      return NextResponse.json({ error: 'Character not found' }, { status: 404 });
    }

    // Simple session management - ChatSession handles conversation memory automatically
    let activeSessionId = sessionId || `${uid}-${character}`;
    console.log(`💫 [CHAT] Using session: ${activeSessionId}`);

    // Check if request was aborted before proceeding
    if (req.signal?.aborted) {
      console.log('🚫 [CHAT] Request was aborted before processing, not deducting message');
      return NextResponse.json({ error: 'Request cancelled' }, { status: 499 });
    }

    // Generate AI response using Gemini with conversation history
    console.log(`🤖 [CHAT] Generating AI response for ${character}...`);
    const geminiService = GeminiService.getInstance(process.env.GOOGLE_GEMINI_API_KEY || '');
    let response;

    try {
      response = await geminiService.sendMessage(activeSessionId, character, characterContext, message);
      console.log(`✅ [CHAT] AI response generated: "${response.substring(0, 50)}..."`);
      
      // Check again if request was aborted after AI response generation
      if (req.signal?.aborted) {
        console.log('🚫 [CHAT] Request was aborted after AI generation, not deducting message or saving conversation');
        return NextResponse.json({ error: 'Request cancelled' }, { status: 499 });
      }
    } catch (error) {
      console.error('❌ [GEMINI] Service error:', error);
      
      // Check if the error is due to abort
      if (req.signal?.aborted || (error instanceof Error && error.name === 'AbortError')) {
        console.log('🚫 [CHAT] Request was aborted during AI generation, not deducting message');
        return NextResponse.json({ error: 'Request cancelled' }, { status: 499 });
      }

      // Handle specific Gemini API errors
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('429')) {
        return NextResponse.json({ 
          error: "Sorry, I couldn't generate a response right now. Please try again!" 
        }, { status: 429 });
      } else if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        return NextResponse.json({ 
          error: "Sorry, I couldn't generate a response right now. Please try again!" 
        }, { status: 503 });
      } else {
        return NextResponse.json({ 
          error: "Sorry, I couldn't generate a response right now. Please try again!" 
        }, { status: 500 });
      }
    }

    // Final check before deducting message - only deduct if request is not aborted
    if (req.signal?.aborted) {
      console.log('🚫 [CHAT] Request was aborted before message deduction, not processing');
      return NextResponse.json({ error: 'Request cancelled' }, { status: 499 });
    }

    // Decrement message count for all users
    const newMessagesLeft = Math.max(0, (userData?.messagesLeft || 0) - 1);
    await adminDb.collection('users').doc(uid).update({
      messagesLeft: newMessagesLeft
    });
    
    // Update userData if it exists
    if (userData) {
      userData.messagesLeft = newMessagesLeft;
    }

    // Final check before saving conversation - only save if request is not aborted
    if (!req.signal?.aborted) {
      // Save conversation using single-document-per-session approach
      const conversationRef = adminDb.collection('conversations').doc(activeSessionId);

      // New messages to append
      const newMessages = [
        {
          sender: 'user',
          content: message,
          timestamp: new Date()
        },
        {
          sender: 'assistant', 
          content: response,
          timestamp: new Date()
        }
      ];

      // Fire and forget - don't await this
      conversationRef.get().then(doc => {
        // Double-check abort status inside the promise
        if (req.signal?.aborted) {
          console.log('🚫 [CONVERSATION] Request was aborted, not saving conversation');
          return;
        }
        
        if (doc.exists) {
          // Document exists, append new messages
          conversationRef.update({
            messages: [...(doc.data()?.messages || []), ...newMessages],
            lastInteraction: new Date(),
            lastMessage: message,
            lastResponse: response
          });
          console.log(`💾 [CONVERSATION] Appended messages to existing session: ${activeSessionId}`);
        } else {
          // Document doesn't exist, create new one
          conversationRef.set({
            userId: uid,
            character,
            sessionId: activeSessionId,
            messages: newMessages,
            createdAt: new Date(),
            lastInteraction: new Date(),
            lastMessage: message,
            lastResponse: response
          });
          console.log(`🆕 [CONVERSATION] Created new session document: ${activeSessionId}`);
        }
      }).catch(error => {
        console.error('❌ [CONVERSATION] Error saving conversation:', error);
      });
    } else {
      console.log('🚫 [CONVERSATION] Request was aborted, not saving conversation to database');
    }

    // TTS generation is now handled by the frontend via separate API call

    return NextResponse.json({ 
      response,
      sessionId: activeSessionId,
      messagesLeft: userData?.messagesLeft || 0
    });

  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}