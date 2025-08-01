import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest, { params }: { params: Promise<{ character: string; id: string }> }) {
  try {
    const { character, id } = await params;
    console.log('🔍 Fetching individual conversation:', id, 'for character:', character);

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;
    console.log('✅ User authenticated:', uid);

    if (!character || !id) {
      console.error('❌ Character or ID parameter missing');
      return NextResponse.json({ error: 'Character and ID are required' }, { status: 400 });
    }

    console.log('🔍 Fetching conversation with ID:', id);

    // Fetch the specific conversation/session
    const conversationsSnapshot = await adminDb
      .collection('conversations')
      .where('userId', '==', uid)
      .where('character', '==', character)
      .where('sessionId', '==', id)
      .get();

    if (conversationsSnapshot.empty) {
      console.log('❌ No conversation found with ID:', id);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    console.log('📊 Found', conversationsSnapshot.size, 'documents for session:', id);

    // Collect all messages from the session
    const allMessages = [];
    let sessionData = {
      id: id,
      character: character,
      createdAt: null,
      lastInteraction: null
    };

    conversationsSnapshot.docs.forEach(doc => {
      const data = doc.data();

      // Update session metadata
      if (!sessionData.createdAt || (data.createdAt && data.createdAt < sessionData.createdAt)) {
        sessionData.createdAt = data.createdAt;
      }
      if (!sessionData.lastInteraction || (data.lastInteraction && data.lastInteraction > sessionData.lastInteraction)) {
        sessionData.lastInteraction = data.lastInteraction;
      }

      // Collect messages
      if (data.messages && Array.isArray(data.messages)) {
        console.log(`📝 Adding ${data.messages.length} messages from new format`);
        allMessages.push(...data.messages);
      } else {
        // Handle old format
        console.log(`📝 Processing old format - message: ${!!data.message}, response: ${!!data.response}`);
        if (data.message) {
          allMessages.push({
            sender: 'user',
            content: data.message,
            timestamp: data.createdAt || data.timestamp
          });
        }
        if (data.response) {
          allMessages.push({
            sender: 'assistant',
            content: data.response,
            timestamp: data.createdAt || data.timestamp
          });
        }
      }
    });

    // Sort messages by timestamp
    allMessages.sort((a, b) => {
      const aTime = a.timestamp?.seconds || a.timestamp?.getTime?.() || 0;
      const bTime = b.timestamp?.seconds || b.timestamp?.getTime?.() || 0;
      return aTime - bTime;
    });

    console.log('✅ Retrieved', allMessages.length, 'messages for session:', id);

    return NextResponse.json({
      id: sessionData.id,
      character: sessionData.character,
      messages: allMessages,
      createdAt: sessionData.createdAt,
      lastInteraction: sessionData.lastInteraction,
      messageCount: allMessages.length
    });

  } catch (error) {
    console.error('Error fetching individual conversation:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}