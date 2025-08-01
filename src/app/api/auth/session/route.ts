import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { getUserDataAdmin } from '@/lib/firebase/admin-helpers';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value || '';

    if (!sessionCookie) {
      console.log('[SESSION] No session cookie found');
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    // First, try to decode the session cookie without strict verification to get the UID
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
      console.log(`[SESSION] Decoded session cookie for user: ${decodedToken.uid}`);
    } catch (decodeError: any) {
      console.error('[SESSION] Failed to decode session cookie:', decodeError.message);
      return NextResponse.json({ error: 'Invalid session cookie' }, { status: 401 });
    }

    const uid = decodedToken.uid;

    // Check if user exists in Firebase Auth Admin
    let userRecord;
    try {
      userRecord = await adminAuth.getUser(uid);
      console.log(`[SESSION] User record found in Firebase Auth for: ${uid}, emailVerified: ${userRecord.emailVerified}`);
    } catch (authError: any) {
      console.error(`[SESSION] User not found in Firebase Auth: ${uid}`, authError.message);

      // Handle the case where user record doesn't exist in Admin SDK but session cookie is valid
      // This can happen when there's a sync issue between client and server Firebase instances

      // Try to get user info from the decoded token
      console.log(`[SESSION] Attempting to recover user data from token for: ${uid}`);

      // If we have basic user info from the token, try to create/import the user
      const tokenEmail = decodedToken.email;
      const tokenName = decodedToken.name || decodedToken.firebase?.identities?.email?.[0]?.split('@')[0];

      if (tokenEmail) {
        try {
          console.log(`[SESSION] Attempting to import user: ${uid} with email: ${tokenEmail}`);

          // Create user record in Firebase Auth Admin
          const importResult = await adminAuth.createUser({
            uid: uid,
            email: tokenEmail,
            displayName: tokenName || tokenEmail.split('@')[0],
            emailVerified: decodedToken.email_verified || false,
          });

          userRecord = importResult;
          console.log(`[SESSION] Successfully imported user: ${uid}`);

        } catch (importError: any) {
          console.error(`[SESSION] Failed to import user: ${uid}`, importError.message);

          // If import fails, try to get user by email (maybe UID mismatch)
          try {
            const existingUser = await adminAuth.getUserByEmail(tokenEmail);
            console.log(`[SESSION] Found existing user by email: ${existingUser.uid}`);
            console.log(`[SESSION] UID mismatch detected: session ${uid} vs auth ${existingUser.uid}`);
            console.log(`[SESSION] Updating session to use correct UID: ${existingUser.uid}`);

            // For UID mismatch, we need to clear the session and ask user to sign in again
            console.log(`[SESSION] UID mismatch detected - clearing session and requesting re-authentication`);

            const response = NextResponse.json({ 
              error: 'Account verification required - please sign in again',
              requiresReauth: true 
            }, { status: 401 });

            // Clear the problematic session cookie
            response.cookies.set('session', '', {
              maxAge: 0,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            });

            return response;
          } catch (emailError: any) {
            console.error(`[SESSION] User not found by email either: ${tokenEmail}`, emailError.message);
            return NextResponse.json({ error: 'User authentication failed - please sign up again' }, { status: 401 });
          }
        }
      } else {
        console.error(`[SESSION] No email in token for user: ${uid}`);
        return NextResponse.json({ error: 'Invalid session data - please sign in again' }, { status: 401 });
      }
    }

    // Now verify the session cookie strictly
    let decodedClaims;
    try {
      decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      console.log(`[SESSION] Session cookie verified successfully for: ${uid}`);
    } catch (verifyError: any) {
      console.error('[SESSION] Session cookie strict verification failed:', verifyError.message);

      // If strict verification fails but user exists, recreate the session
      if (userRecord) {
        console.log(`[SESSION] User exists but session invalid, clearing session for: ${uid}`);
        return NextResponse.json({ error: 'Session expired - please sign in again' }, { status: 401 });
      }

      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get user data from Firestore
    let userData = await getUserDataAdmin(uid);

    // Create or update user data in Firestore
    if (!userData) {
      console.log(`[SESSION] Creating new Firestore record for user: ${uid}`);
      userData = {
        uid: userRecord.uid,
        name: userRecord.displayName || userRecord.email?.split('@')[0] || 'Anonymous',
        email: userRecord.email || '',
        photoURL: userRecord.photoURL || '',
        isVerified: userRecord.emailVerified || false,
        currentPlan: 'free',
        subscriptionId: null,
        subscriptionStatus: null,
        messagesLeft: 30,
        referralCode: Math.random().toString(36).substr(2, 8).toUpperCase(),
        referredBy: null,
        lastDailyClaim: new Date(),
        createdAt: new Date(),
      };

      await adminDb.collection('users').doc(uid).set(userData);
      console.log(`[SESSION] Created Firestore record for user: ${uid}`);
    } else {
      // Update verification status if it has changed
      const shouldUpdate = userData.isVerified !== userRecord.emailVerified;

      if (shouldUpdate) {
        console.log(`[SESSION] Updating verification status for user: ${uid} from ${userData.isVerified} to ${userRecord.emailVerified}`);

        const updateData: any = {
          isVerified: userRecord.emailVerified
        };

        // Also update other fields if they've changed
        if (userData.name !== userRecord.displayName && userRecord.displayName) {
          updateData.name = userRecord.displayName;
        }
        if (userData.photoURL !== userRecord.photoURL && userRecord.photoURL) {
          updateData.photoURL = userRecord.photoURL;
        }

        await adminDb.collection('users').doc(uid).update(updateData);
        userData = { ...userData, ...updateData };
        console.log(`[SESSION] Updated user data for: ${uid}`);
      }
    }

    return NextResponse.json({
      user: {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        emailVerified: decodedClaims.email_verified || userRecord.emailVerified
      },
      userData
    });

  } catch (error: any) {
    if (error.code === 'auth/uid-mismatch') {
          console.log(`[SESSION] UID mismatch detected: session ${uid} vs auth ${error.correctUid}`);
          console.log(`[SESSION] Clearing invalid session and requiring re-authentication`);

          // Clear the invalid session cookie
          const response = NextResponse.json({ 
            error: 'UID mismatch detected',
            requiresReauth: true,
            message: 'Please sign in again with your existing account'
          }, { status: 401 });

          response.cookies.set('session', '', {
            name: 'session',
            value: '',
            maxAge: 0,
            httpOnly: true,
            secure: true,
            sameSite: 'lax'
          });

          return response;
        }
    console.error('[SESSION] Unexpected error verifying session:', error);
    return NextResponse.json({ error: 'Session verification failed' }, { status: 401 });
  }
}