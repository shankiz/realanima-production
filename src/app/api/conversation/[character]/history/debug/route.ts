import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ character: string }> }
) {
  try {
    const { character } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    if (!adminAuth) {
      console.error('[HISTORY_DEBUG] Firebase Admin not initialized');
      return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 500 });
    }

    if (!adminDb) {
      console.error('[HISTORY_DEBUG] Firestore not initialized');
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 500 });
    }
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get all conversations for this user and character (no limits)
    const snapshot = await adminDb
      .collection('conversations')
      .where('userId', '==', uid)
      .where('character', '==', character)
      .get();

    const debugInfo: {
      totalDocs: number;
      collections: any[];
      sampleDocs: { id: string; data: any; }[];
      totalUserConversations?: number;
      charactersFound?: string[];
    } = {
      totalDocs: snapshot.size,
      collections: [],
      sampleDocs: snapshot.docs.slice(0, 5).map(doc => ({
        id: doc.id,
        data: doc.data()
      }))
    };

    // Also check if any conversations exist for this user at all
    const allUserConversations = await adminDb
      .collection('conversations')
      .where('userId', '==', uid)
      .get();

    debugInfo.totalUserConversations = allUserConversations.size;
    debugInfo.charactersFound = [...new Set(allUserConversations.docs.map(doc => doc.data().character))];

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Debug route error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Debug failed',
      details: errorMessage 
    }, { status: 500 });
  }
}