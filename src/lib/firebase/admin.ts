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
console.log('Has FIREBASE_PRIVATE_KEY_BASE64:', !!process.env.FIREBASE_PRIVATE_KEY_BASE64);
console.log('FIREBASE_PROJECT_ID value:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL value:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);

// Robust private key normalization
function normalizePrivateKey(rawInput: string): string {
  let key = rawInput;

  // Remove optional surrounding quotes if the entire value was quoted
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith('\'') && key.endsWith('\''))) {
    key = key.slice(1, -1);
  }

  // First, unescape common escaped sequences from env providers
  key = key
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  // Remove zero-width and BOM characters that sometimes sneak in via copy/paste
  key = key.replace(/[\u200B\uFEFF]/g, '');

  // If the value looks like pure base64 without PEM markers, try to decode
  const hasPemMarkers = key.includes('-----BEGIN') && key.includes('-----END');
  const looksBase64 = /^[A-Za-z0-9+/=\s]+$/.test(key) && !hasPemMarkers;
  if (looksBase64) {
    try {
      const decoded = Buffer.from(key.replace(/\s+/g, ''), 'base64').toString('utf8');
      if (decoded.includes('-----BEGIN') && decoded.includes('-----END')) {
        key = decoded;
      }
    } catch {
      // fall through; we'll validate below
    }
  }

  // Ensure we only keep the exact PEM block and normalize whitespace
  const beginMarker = '-----BEGIN PRIVATE KEY-----';
  const endMarker = '-----END PRIVATE KEY-----';
  const beginIdx = key.indexOf(beginMarker);
  const endIdx = key.indexOf(endMarker);
  if (beginIdx === -1 || endIdx === -1) {
    throw new Error('Private key format is invalid - missing BEGIN/END markers');
  }

  const base64BodyRaw = key
    .slice(beginIdx + beginMarker.length, endIdx)
    .replace(/[^A-Za-z0-9+/=]/g, ''); // keep only base64 chars

  if (!base64BodyRaw) {
    throw new Error('Private key body is empty after normalization');
  }

  // Re-wrap the body at 64 chars per line
  const bodyWrapped = (base64BodyRaw.match(/.{1,64}/g) || [base64BodyRaw]).join('\n');
  const normalized = `${beginMarker}\n${bodyWrapped}\n${endMarker}\n`;

  // Quick sanity: try to base64-decode to ensure it's structurally valid
  try {
    // Decode base64 body; this validates padding/length to avoid ASN.1 errors later
    Buffer.from(base64BodyRaw, 'base64');
  } catch (e) {
    throw new Error('Private key base64 content is invalid');
  }

  return normalized;
}

// Prefer explicit BASE64 env if provided to avoid escaping issues on hosts
const rawKey = process.env.FIREBASE_PRIVATE_KEY || '';
const base64Key = (process.env.FIREBASE_PRIVATE_KEY_BASE64 || '').trim();
let privateKey = '';

try {
  if (base64Key) {
    console.log('🔧 Using FIREBASE_PRIVATE_KEY_BASE64 to construct PEM');
    const cleanedB64 = base64Key.replace(/\s+/g, '');
    privateKey = Buffer.from(cleanedB64, 'base64').toString('utf8');
  } else if (rawKey) {
    console.log('🔧 Using FIREBASE_PRIVATE_KEY (raw) to construct PEM');
    privateKey = rawKey;
  }

  if (privateKey) {
    console.log('🔧 Original key length:', privateKey.length);
    privateKey = normalizePrivateKey(privateKey);
    console.log('🔧 Cleaned key length:', privateKey.length);
    console.log('🔧 Key starts with:', privateKey.substring(0, 30));
    console.log('🔧 Key ends with:', privateKey.substring(privateKey.length - 30));
  } else {
    privateKey = undefined as unknown as string; // align with previous logic
  }
} catch (error) {
  console.error('❌ Error cleaning private key:', error);
  privateKey = undefined as unknown as string;
}

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
    // Only initialize if we have real credentials and not during build
    if (privateKey && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && !isBuildTime) {
      console.log('🔥 Initializing Firebase Admin with credentials...');

      // Validate private key format before attempting to initialize
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
        throw new Error('Private key format is invalid - missing BEGIN/END markers');
      }

      app = initializeApp({
        credential: cert(firebaseAdminConfig),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      if (isBuildTime) {
        console.warn('⚠️ Firebase Admin: Skipping initialization during build time');
      } else {
        console.warn('⚠️ Firebase Admin: Missing credentials, skipping initialization');
      }
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
    privateKeyPreview: firebaseAdminConfig.privateKey?.substring(0, 50) + '...',
    hasPrivateKey: !!privateKey,
    hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    isBuildTime
  });

  // Don't throw during build time or if it's a key parsing error
  if (isBuildTime || (error instanceof Error && error.message.includes('Failed to parse private key'))) {
    console.warn('Firebase Admin initialization failed - continuing without Firebase Admin');
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

// Helper function to verify Firebase session cookie
export async function verifySessionCookie(sessionCookie: string) {
  if (!adminAuth) {
    throw new Error('Firebase Admin not initialized');
  }

  try {
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    throw error;
  }
}

export default app;