
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    // Check if Firebase Admin is initialized
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Delete all user data from Firestore
    const batch = adminDb.batch();

    // Delete user document
    const userRef = adminDb.collection('users').doc(userId);
    batch.delete(userRef);

    // Delete all conversations for this user
    const conversationsSnapshot = await adminDb.collection('conversations')
      .where('userId', '==', userId)
      .get();
    
    conversationsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete all subscriptions for this user
    const subscriptionsSnapshot = await adminDb.collection('subscriptions')
      .where('userId', '==', userId)
      .get();
    
    subscriptionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete all billing data for this user
    const billingSnapshot = await adminDb.collection('billing')
      .where('userId', '==', userId)
      .get();
    
    billingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Commit all deletions
    await batch.commit();

    // Delete the user from Firebase Auth (this should be done last)
    await adminAuth.deleteUser(userId);

    return NextResponse.json({ 
      success: true, 
      message: 'Account deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
