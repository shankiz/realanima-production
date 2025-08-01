
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

// POST /api/user/deduct-message - Deduct one credit/message
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify Firebase token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const userRef = adminDb.collection('users').doc(userId);
    
    const result = await adminDb.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const currentCredits = userData?.credits || 0;
      const currentMessagesLeft = userData?.messagesLeft || 0;

      if (currentCredits <= 0 || currentMessagesLeft <= 0) {
        throw new Error('No credits remaining');
      }

      const newCredits = currentCredits - 1;
      const newMessagesLeft = currentMessagesLeft - 1;

      transaction.update(userRef, {
        credits: newCredits,
        messagesLeft: newMessagesLeft,
        lastMessageSent: adminDb.serverTimestamp()
      });

      return {
        credits: newCredits,
        messagesLeft: newMessagesLeft
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deducting message:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
