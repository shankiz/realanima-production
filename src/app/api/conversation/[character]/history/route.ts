import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ character: string }> }) {
  try {
    const { character } = await params;
    console.log('🔍 History API called for character:', character);

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log('✅ User authenticated:', uid);

    if (!character) {
      console.error('❌ Character parameter missing');
      return NextResponse.json({ error: 'Character is required' }, { status: 400 });
    }

    console.log('🔍 Fetching conversations for user:', uid, 'character:', character);

    // Check if conversations collection exists and has any documents
    const totalDocsSnapshot = await adminDb.collection('conversations').limit(1).get();
    console.log('📊 Total conversations collection has docs:', !totalDocsSnapshot.empty);

    // Check user's conversations across all characters
    const userDocsSnapshot = await adminDb
      .collection('conversations')
      .where('userId', '==', uid)
      .limit(5)
      .get();
    console.log('📊 User has', userDocsSnapshot.size, 'total conversations across all characters');

    let conversations = [];

    try {
      console.log('🔍 Attempting to fetch conversations with orderBy...');
      // Fetch conversations grouped by sessionId
      const conversationsSnapshot = await adminDb
        .collection('conversations')
        .where('userId', '==', uid)
        .where('character', '==', character)
        .orderBy('lastInteraction', 'desc')
        .limit(50)
        .get();

      console.log('📊 Found', conversationsSnapshot.size, 'conversation documents for character:', character);

      // Log sample document structure for debugging
      if (!conversationsSnapshot.empty) {
        const firstDoc = conversationsSnapshot.docs[0];
        const firstData = firstDoc.data();
        console.log('📄 Sample document structure:', {
          id: firstDoc.id,
          userId: firstData.userId,
          character: firstData.character,
          sessionId: firstData.sessionId,
          hasMessages: Array.isArray(firstData.messages),
          messageCount: firstData.messages?.length || 0,
          hasMessage: !!firstData.message,
          hasResponse: !!firstData.response,
          timestamp: firstData.timestamp?.seconds || firstData.timestamp,
          lastInteraction: firstData.lastInteraction?.seconds || firstData.lastInteraction
        });
      }

      // Group conversations by sessionId
      const sessionMap = new Map();

      conversationsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        const sessionId = data.sessionId || doc.id;

        console.log(`📄 Processing doc ${index + 1}/${conversationsSnapshot.size}:`, {
          docId: doc.id,
          sessionId: sessionId,
          userId: data.userId,
          character: data.character,
          hasMessages: Array.isArray(data.messages),
          messageCount: data.messages?.length || 0,
          hasOldFormat: !!(data.message || data.response)
        });

        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            id: sessionId,
            messages: [],
            createdAt: data.createdAt || data.timestamp,
            lastInteraction: data.lastInteraction || data.timestamp,
            character: data.character
          });
        }

        const session = sessionMap.get(sessionId);

        // Add messages to the session
        if (data.messages && Array.isArray(data.messages)) {
          console.log(`📝 Adding ${data.messages.length} messages from new format`);
          session.messages.push(...data.messages);
        } else {
          // Handle old format
          console.log(`📝 Processing old format - message: ${!!data.message}, response: ${!!data.response}`);
          if (data.message) {
            session.messages.push({
              sender: 'user',
              content: data.message,
              timestamp: data.createdAt || data.timestamp
            });
          }
          if (data.response) {
            session.messages.push({
              sender: 'assistant',
              content: data.response,
              timestamp: data.createdAt || data.timestamp
            });
          }
        }

        // Update timestamps to latest
        if (data.lastInteraction && (!session.lastInteraction || 
            (data.lastInteraction.seconds || data.lastInteraction.getTime?.() || data.lastInteraction) > 
            (session.lastInteraction.seconds || session.lastInteraction.getTime?.() || session.lastInteraction))) {
          session.lastInteraction = data.lastInteraction;
        }
      });

      // Convert to array and sort by last interaction
      conversations = Array.from(sessionMap.values())
        .filter(session => {
          // Only include sessions that have actual messages
          return session.messages.length > 0 && 
                 session.messages.some((msg: any) => msg.content && msg.content.trim().length > 0);
        })
        .map(session => {
          // Sort messages by timestamp
          session.messages.sort((a: any, b: any) => {
            const aTime = a.timestamp?.seconds || a.timestamp?.getTime?.() || 0;
            const bTime = b.timestamp?.seconds || b.timestamp?.getTime?.() || 0;
            return aTime - bTime;
          });

          const firstUserMessage = session.messages.find((m: any) => m.sender === 'user' || m.role === 'user');
          const firstAssistantMessage = session.messages.find((m: any) => m.sender === 'assistant' || m.role === 'assistant');
          // Removed unused last message variables

          return {
            id: session.id,
            sessionId: session.id,
            messageCount: Math.ceil(session.messages.length / 2), // Rough estimate of exchanges

            // Only first exchange for preview
            message: firstUserMessage?.content || '',
            response: firstAssistantMessage?.content || '',

            createdAt: session.createdAt,
            lastInteraction: session.lastInteraction,
            timestamp: session.lastInteraction
          };
        })
        .sort((a, b) => {
          const aTime = a.lastInteraction?.seconds || a.lastInteraction?.getTime?.() || 0;
          const bTime = b.lastInteraction?.seconds || b.lastInteraction?.getTime?.() || 0;
          return bTime - aTime; // Newest first
        })
        .slice(0, 20); // Limit to 20 most recent sessions

      console.log('✅ Found', sessionMap.size, 'unique sessions');
      console.log('📊 Processed conversations:', conversations.length);

      // Log final conversation summaries
      conversations.slice(0, 3).forEach((conv, i) => {
        console.log(`📋 Conversation ${i + 1}:`, {
          id: conv.id,
          messageCount: conv.messageCount,
          hasPreview: !!(conv.message || conv.response),
          timestamp: conv.timestamp
        });
      });

    } catch (indexError) {
      console.warn('⚠️ OrderBy query failed, trying without orderBy:', indexError instanceof Error ? indexError.message : String(indexError));

      // Fallback: fetch without orderBy
      const conversationsSnapshot = await adminDb
        .collection('conversations')
        .where('userId', '==', uid)
        .where('character', '==', character)
        .limit(50)
        .get();

      // Same grouping logic as above
      const sessionMap = new Map();

      conversationsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const sessionId = data.sessionId || doc.id;

        if (!sessionMap.has(sessionId)) {
          sessionMap.set(sessionId, {
            id: sessionId,
            messages: [],
            createdAt: data.createdAt || data.timestamp,
            lastInteraction: data.lastInteraction || data.timestamp,
            character: data.character
          });
        }

        const session = sessionMap.get(sessionId);

        if (data.messages && Array.isArray(data.messages)) {
          session.messages.push(...data.messages);
        } else {
          if (data.message) {
            session.messages.push({
              sender: 'user',
              content: data.message,
              timestamp: data.createdAt || data.timestamp
            });
          }
          if (data.response) {
            session.messages.push({
              sender: 'assistant',
              content: data.response,
              timestamp: data.createdAt || data.timestamp
            });
          }
        }

        if (data.lastInteraction && (!session.lastInteraction || 
            (data.lastInteraction.seconds || data.lastInteraction.getTime?.() || data.lastInteraction) > 
            (session.lastInteraction.seconds || session.lastInteraction.getTime?.() || session.lastInteraction))) {
          session.lastInteraction = data.lastInteraction;
        }
      });

      conversations = Array.from(sessionMap.values())
        .filter(session => {
          // Only include sessions that have actual messages
          return session.messages.length > 0 && 
                 session.messages.some((msg: any) => msg.content && msg.content.trim().length > 0);
        })
        .map(session => {
          session.messages.sort((a: any, b: any) => {
            const aTime = a.timestamp?.seconds || a.timestamp?.getTime?.() || 0;
            const bTime = b.timestamp?.seconds || b.timestamp?.getTime?.() || 0;
            return aTime - bTime;
          });

          const firstUserMessage = session.messages.find((m: any) => m.sender === 'user' || m.role === 'user');
          const firstAssistantMessage = session.messages.find((m: any) => m.sender === 'assistant' || m.role === 'assistant');
          // Removed unused last message variables

          return {
            id: session.id,
            sessionId: session.id,
            messageCount: Math.ceil(session.messages.length / 2),

            message: firstUserMessage?.content || '',
            response: firstAssistantMessage?.content || '',

            createdAt: session.createdAt,
            lastInteraction: session.lastInteraction,
            timestamp: session.lastInteraction
          };
        })
        .sort((a, b) => {
          const aTime = a.lastInteraction?.seconds || a.lastInteraction?.getTime?.() || 0;
          const bTime = b.lastInteraction?.seconds || b.lastInteraction?.getTime?.() || 0;
          return bTime - aTime;
        })
        .slice(0, 20);

      console.log('Found conversation sessions without orderBy:', conversations.length);
    }

    return NextResponse.json({ 
      conversations,
      total: conversations.length
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error), error instanceof Error ? error.stack : undefined);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}