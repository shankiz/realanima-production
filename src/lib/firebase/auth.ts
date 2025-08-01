import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';

export interface UserData {
  uid: string;
  name: string;
  email: string;
  isVerified: boolean;
  currentPlan: 'free' | 'premium' | 'ultimate';
  subscriptionId?: string | null;
  subscriptionStatus?: 'active' | 'cancelled' | 'expired' | null;
  messagesLeft: number;
  referralCode: string;
  referredBy?: string | null;
  lastMessageReset?: Date;
  createdAt: Date;
}

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update profile with name
    await updateProfile(user, { displayName: name });

    // Send email verification
    await sendEmailVerification(user);

    // Create user document in Firestore
    const userData: UserData = {
      uid: user.uid,
      name,
      email,
      isVerified: false,
      currentPlan: 'free',
      subscriptionId: null,
      subscriptionStatus: null,
      messagesLeft: 30,
      referralCode: generateReferralCode(),
      referredBy: null,
      lastMessageReset: new Date(),
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), userData);

    return { user, userData };
  } catch (error) {
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if email is verified
    if (!user.emailVerified) {
      // Sign out the user immediately
      await signOut(auth);
      throw new Error('Please verify your email before signing in. Check your inbox and spam folder.');
    }

    // Create session cookie
    const idToken = await user.getIdToken();
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    // Sync verification status with backend
    try {
      await fetch('/api/auth/sync-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
    } catch (syncError) {
      console.log('Could not sync verification status:', syncError);
      // Don't throw error - this is not critical for login
    }

    return user;
  } catch (error) {
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    console.log('Starting Google sign-in...');
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    console.log('Google sign-in successful for user:', user.uid);
    console.log('User email:', user.email);
    console.log('User verified:', user.emailVerified);

    // Create session cookie with improved error handling
    console.log('Getting fresh ID token...');
    const idToken = await user.getIdToken(true); // Force refresh
    console.log('ID token obtained, creating session...');

    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
      credentials: 'include'
    });

    console.log('Session response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Session creation failed:', errorText);
      throw new Error(`Failed to create session: ${response.status} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log('Session created successfully:', responseData);

    if (responseData.isNewUser) {
      console.log('New user created and logged in automatically');
    } else {
      console.log('Existing user logged in');
    }

    // Ensure session is fully established before returning
    // Verify the session was created by making a quick check
    let sessionVerified = false;
    let attempts = 0;

    while (!sessionVerified && attempts < 3) {
      await new Promise(resolve => setTimeout(resolve, 300 + (attempts * 200)));

      try {
        const sessionCheck = await fetch('/api/auth/session', {
          credentials: 'include',
          cache: 'no-store'
        });

        if (sessionCheck.ok) {
          sessionVerified = true;
          console.log('✅ Session verified after sign-in');
        } else {
          console.log(`⏳ Session not ready yet (attempt ${attempts + 1}/3)`);
        }
      } catch (error) {
        console.log(`⏳ Session check failed (attempt ${attempts + 1}/3)`);
      }

      attempts++;
    }

    return { user, isNewUser: responseData.isNewUser };
  } catch (error) {
    console.error('Google sign-in error:', error);

    // Handle specific popup errors
    if (error instanceof Error) {
      if (error.message.includes('popup-closed-by-user')) {
        throw new Error('Sign-in was cancelled. Please try again.');
      }
      if (error.message.includes('popup-blocked')) {
        throw new Error('Popup was blocked. Please allow popups and try again.');
      }
      if (error.message.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      }
    }

    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);

    // Clear session cookie
    await fetch('/api/auth/signout', {
      method: 'POST',
    });
  } catch (error) {
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// Resend email verification
export const resendEmailVerification = async (email: string, password: string) => {
  try {
    // Temporarily sign in to get the user object
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user.emailVerified) {
      await signOut(auth);
      throw new Error('Email is already verified. You can sign in normally.');
    }

    // Send verification email
    await sendEmailVerification(user);
    
    // Sign out immediately
    await signOut(auth);
    
    return { success: true };
  } catch (error) {
    // Make sure user is signed out even if there's an error
    await signOut(auth);
    throw error;
  }
};

// Get user data from Firestore (client-side)
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Update user data
export const updateUserData = async (uid: string, data: Partial<UserData>) => {
  try {
    await updateDoc(doc(db, 'users', uid), data);
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
};

// Generate referral code
const generateReferralCode = (): string => {
  return Math.random().toString(36).substr(2, 8).toUpperCase();
};