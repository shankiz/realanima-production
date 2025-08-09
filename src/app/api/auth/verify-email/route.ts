
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { applyActionCode } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

export async function POST(request: NextRequest) {
  try {
    const { actionCode } = await request.json();

    if (!actionCode) {
      return NextResponse.json({ error: 'No action code provided' }, { status: 400 });
    }

    console.log('[VERIFY_EMAIL] Processing email verification...');

    // Apply the action code to verify the email
    try {
      await applyActionCode(auth, actionCode);
      console.log('[VERIFY_EMAIL] Email verification successful');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[VERIFY_EMAIL] Failed to apply action code:', errorMessage);
      return NextResponse.json({ 
        error: 'Invalid or expired verification code',
        details: errorMessage 
      }, { status: 400 });
    }

    // Get the current user (if signed in)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      
      if (!adminAuth) {
        console.log('[VERIFY_EMAIL] Firebase Admin not initialized');
        return NextResponse.json({ 
          success: true,
          message: 'Email verified successfully! You can now sign in.'
        });
      }

      if (!adminDb) {
        console.log('[VERIFY_EMAIL] Firestore not initialized');
        return NextResponse.json({ 
          success: true,
          message: 'Email verified successfully! You can now sign in.'
        });
      }
      
      try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const uid = decodedToken.uid;

        // Update Firestore document
        const userRef = adminDb.collection('users').doc(uid);
        await userRef.update({ isVerified: true });
        
        console.log(`[VERIFY_EMAIL] Updated Firestore verification status for user: ${uid}`);
      } catch {
        console.log('[VERIFY_EMAIL] Could not verify token, user may need to sign in again');
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Email verified successfully! You can now sign in.'
    });

  } catch (error) {
    console.error('[VERIFY_EMAIL] Verification error:', error);
    return NextResponse.json({ 
      error: 'Failed to verify email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
