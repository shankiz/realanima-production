import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'ID token required' }, { status: 400 });
    }

    // Verify the ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    console.log(`[SYNC] Syncing verification for user: ${uid}`);

    // Get fresh user record from Firebase Auth
    const userRecord = await adminAuth.getUser(uid);
    console.log(`[SYNC] Firebase Auth emailVerified: ${userRecord.emailVerified}`);

    // Update Firestore document
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.log(`[SYNC] User document not found in Firestore for UID: ${uid}`);
      return NextResponse.json({ error: 'User not found in Firestore' }, { status: 404 });
    }

    const userData = userDoc.data();
    console.log(`[SYNC] Current Firestore isVerified: ${userData?.isVerified}`);

    // Update verification status if different
    if (userData?.isVerified !== userRecord.emailVerified) {
      console.log(`[SYNC] Updating verification status: ${userData?.isVerified} -> ${userRecord.emailVerified}`);

      await userRef.update({
        isVerified: userRecord.emailVerified,
        verifiedAt: userRecord.emailVerified ? new Date() : null
      });

      console.log(`[SYNC] ✅ Successfully updated verification status to: ${userRecord.emailVerified}`);
    } else {
      console.log(`[SYNC] Verification status already up to date: ${userRecord.emailVerified}`);
    }

    return NextResponse.json({ 
      success: true, 
      isVerified: userRecord.emailVerified 
    });

  } catch (error: unknown) {
    console.error('[SYNC] Error syncing verification status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Sync failed: ' + errorMessage }, { status: 500 });
  }
}