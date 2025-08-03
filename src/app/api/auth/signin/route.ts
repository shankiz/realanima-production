import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    console.log('[SIGNIN] Verifying ID token...');
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (tokenError: any) {
      console.error('[SIGNIN] ID token verification failed:', tokenError.message);
      return NextResponse.json({ 
        error: 'Invalid token', 
        details: tokenError.message 
      }, { status: 401 });
    }

    let { uid, email, name, picture, email_verified } = decodedToken;
    console.log('[SIGNIN] Token verified for user:', uid);

    // Ensure user exists in Firebase Auth Admin
    let userRecord;
    try {
      userRecord = await adminAuth.getUser(uid);
      console.log('[SIGNIN] User record found in Firebase Auth');
    } catch (authError: any) {
      console.error('[SIGNIN] User not found in Firebase Auth:', authError.message);
      return NextResponse.json({ 
        error: 'User authentication failed', 
        details: 'User record not found' 
      }, { status: 401 });
    }

    // Check if there's already a user with this email but different UID
    let freshUserRecord;

    if (email) {
      try {
        const existingUserByEmail = await adminAuth.getUserByEmail(email);
        if (existingUserByEmail.uid !== uid) {
          console.log(`[SIGNIN] UID mismatch detected: token ${uid} vs existing ${existingUserByEmail.uid}`);
          console.log(`[SIGNIN] Multiple Firebase Auth accounts detected for email: ${email}`);

          // Return error requiring proper re-authentication with the correct account
          return NextResponse.json({ 
            error: 'Account conflict detected',
            requiresReauth: true,
            message: `An account with email ${email} already exists. Please sign out and sign in with your original account.`
          }, { status: 409 });
        } else {
          freshUserRecord = existingUserByEmail;
        }
      } catch (emailError: any) {
        // User doesn't exist by email, try to get by UID
        try {
          freshUserRecord = await adminAuth.getUser(uid);
          console.log(`[SIGNIN] Fresh user record - emailVerified: ${freshUserRecord.emailVerified}`);
        } catch (getUserError: unknown) {
          console.error(`[SIGNIN] Failed to get fresh user record: ${uid}`, getUserError.message);

          // If we can't get the user record, but we have a valid token, create it
          try {
            console.log(`[SIGNIN] Creating missing user record for: ${uid}`);
            freshUserRecord = await adminAuth.createUser({
              uid: uid,
              email: email || '',
              displayName: name || email?.split('@')[0] || 'Anonymous',
              emailVerified: email_verified || false,
            });
            console.log(`[SIGNIN] Created missing user record: ${uid}`);
          } catch (createError: any) {
            console.error(`[SIGNIN] Failed to create user record: ${uid}`, createError.message);
            return NextResponse.json({ error: 'Failed to create user session' }, { status: 500 });
          }
        }
      }
    } else {
      // No email, just try to get by UID
      try {
        freshUserRecord = await adminAuth.getUser(uid);
        console.log(`[SIGNIN] Fresh user record - emailVerified: ${freshUserRecord.emailVerified}`);
      } catch (getUserError: unknown) {
        console.error(`[SIGNIN] Failed to get fresh user record: ${uid}`, getUserError.message);
        return NextResponse.json({ error: 'Failed to create user session' }, { status: 500 });
      }
    }

    // Check if user exists in Firestore (use the token UID)
    const userRef = adminDb.collection('users').doc(uid);
    const userDoc = await userRef.get();

    let userData: any;
    let isNewUser = false;

    if (!userDoc.exists) {
      console.log('[SIGNIN] Creating new user:', uid);
      // Create new user with data from both token and fresh user record
      userData = {
        uid: uid,
        name: name || freshUserRecord.displayName || email?.split('@')[0] || 'Anonymous',
        email: email || freshUserRecord.email || '',
        photoURL: picture || freshUserRecord.photoURL || '',
        isVerified: email_verified || freshUserRecord.emailVerified || false,
        currentPlan: 'free',
        subscriptionId: null,
        subscriptionStatus: null,
        messagesLeft: 30,
        lastMessageReset: new Date(),
        referralCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
        referredBy: null,
        lastDailyClaim: new Date(),
        createdAt: new Date(),
      };

      await userRef.set(userData);
      isNewUser = true;
      console.log('[SIGNIN] New user created successfully:', uid);
    } else {
      console.log('[SIGNIN] User exists, updating if needed...');
      // Update existing user with fresh data
      userData = userDoc.data();
      const updateData: any = {};

      const currentName = name || freshUserRecord.displayName;
      const currentPhoto = picture || freshUserRecord.photoURL;
      const currentVerified = email_verified || freshUserRecord.emailVerified;

      if (userData.name !== currentName && currentName) updateData.name = currentName;
      if (userData.photoURL !== currentPhoto && currentPhoto) updateData.photoURL = currentPhoto;
      if (userData.isVerified !== currentVerified) {
        updateData.isVerified = currentVerified;
        console.log(`[SIGNIN] Updating verification status: ${userData.isVerified} -> ${currentVerified}`);
      }

      // Ensure lastMessageReset field exists for all users
      if (!userData.lastMessageReset) {
        updateData.lastMessageReset = new Date();
        console.log(`[SIGNIN] Adding missing lastMessageReset field for user: ${uid}`);
      }

      if (Object.keys(updateData).length > 0) {
        await userRef.update(updateData);
        userData = { ...userData, ...updateData };
        console.log('[SIGNIN] User updated:', uid, updateData);
      }
    }

    // Create session cookie with the original idToken
    console.log('[SIGNIN] Creating session cookie...');
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    let sessionCookie;

    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      console.log('[SIGNIN] Session cookie created successfully');
    } catch (cookieError: any) {
      console.error('[SIGNIN] Failed to create session cookie:', cookieError.message);
      return NextResponse.json({ 
        error: 'Failed to create session', 
        details: cookieError.message 
      }, { status: 500 });
    }

    // Set the session cookie
    const response = NextResponse.json({ 
      success: true, 
      user: userData,
      isNewUser,
      message: isNewUser ? 'Account created and signed in successfully!' : 'Signed in successfully!'
    });

    response.cookies.set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge expects seconds, not milliseconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    console.log('[SIGNIN] Session cookie set successfully');
    return response;

  } catch (error) {
    console.error('Session creation error:', error);
    return NextResponse.json({ 
      error: 'Failed to create session', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}