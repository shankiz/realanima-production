import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Debug environment variables
console.log('🔍 Environment Debug Info:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY:', process.env.RAILWAY);
console.log('VERCEL:', process.env.VERCEL);
console.log('Has FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID);
console.log('Has FIREBASE_CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL);
console.log('Has FIREBASE_PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY);
console.log('FIREBASE_PROJECT_ID value:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL value:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);

// Clean and validate private key
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Check if we're in build time and missing env vars
const isBuildTime = process.env.NODE_ENV === 'production' && !privateKey && !process.env.FIREBASE_PROJECT_ID;

if (!privateKey && !isBuildTime) {
  throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
}

if (!process.env.FIREBASE_PROJECT_ID && !isBuildTime) {
  throw new Error('FIREBASE_PROJECT_ID environment variable is not set');
}

if (!process.env.FIREBASE_CLIENT_EMAIL && !isBuildTime) {
  throw new Error('FIREBASE_CLIENT_EMAIL environment variable is not set');
}

// If we're missing required env vars during build, create dummy config
if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.warn('⚠️ Firebase Admin: Missing environment variables during build time');
  console.warn('Missing:', {
    privateKey: !privateKey,
    projectId: !process.env.FIREBASE_PROJECT_ID,
    clientEmail: !process.env.FIREBASE_CLIENT_EMAIL
  });
}

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'dummy-project',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'dummy@dummy.com',
  privateKey: privateKey || 'dummy-key',
};

// Initialize Firebase Admin
let app;
try {
  // Check if Firebase Admin app is already initialized
  if (getApps().length === 0) {
    // Only initialize if we have real credentials
    if (privateKey && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🔥 Initializing Firebase Admin with credentials...');
      app = initializeApp({
        credential: cert(firebaseAdminConfig),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️ Firebase Admin: Missing credentials, skipping initialization');
      app = null;
    }
  } else {
    app = getApps()[0];
    console.log('✅ Firebase Admin: Using existing app');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error);
  console.error('Config used:', {
    projectId: firebaseAdminConfig.projectId,
    clientEmail: firebaseAdminConfig.clientEmail,
    privateKeyLength: firebaseAdminConfig.privateKey?.length,
    hasPrivateKey: !!privateKey,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL
  });
  
  // Don't throw during build time
  if (isBuildTime) {
    console.warn('Firebase Admin initialization failed during build time - this is expected');
    app = null;
  } else {
    throw new Error(`Failed to initialize Firebase Admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const adminAuth = app ? getAuth(app) : null;
export const adminDb = app ? getFirestore(app) : null;

// Helper function to verify Firebase ID token
export async function verifyIdToken(idToken: string) {
  if (!adminAuth) {
    throw new Error('Firebase Admin not initialized');
  }
  
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
}

export default app;