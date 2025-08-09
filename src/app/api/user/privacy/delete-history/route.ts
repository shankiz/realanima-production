
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log('🗑️ Deleting all conversation history for user:', uid);

    // Delete all conversations for this user
    const conversationsQuery = adminDb
      .collection('conversations')
      .where('userId', '==', uid);

    const snapshot = await conversationsQuery.get();
    console.log('📊 Found', snapshot.size, 'conversations to delete');

    // Delete in batches to avoid timeout
    const batch = adminDb.batch();
    let deleteCount = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });

    if (deleteCount > 0) {
      await batch.commit();
      console.log('✅ Successfully deleted', deleteCount, 'conversations');
    } else {
      console.log('ℹ️ No conversations found to delete');
    }

    return NextResponse.json({ 
      success: true, 
      deletedCount: deleteCount,
      message: `Deleted ${deleteCount} conversation records` 
    });

  } catch (error) {
    console.error('❌ Error deleting conversation history:', error);
    return NextResponse.json({ 
      error: 'Failed to delete conversation history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
