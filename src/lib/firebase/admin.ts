import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';

function normalizePrivateKey(rawKey?: string | null): string | null {
  if (!rawKey) return null;

  let key = rawKey.trim();

  // Remove BOM and zero-width/invisible characters that can break PEM parsing
  key = key.replace(/\uFEFF/g, '').replace(/[\u200B-\u200D\u2060\u00A0]/g, '');

  // If wrapped in quotes, strip them
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }

  // Replace escaped newlines and remove any carriage returns
  key = key.replace(/\\n/g, '\n').replace(/\r/g, '');

  // If this looks like a base64 string (no header/footer but long and base64y), try to decode
  const looksLikeBase64 = !key.includes('-----BEGIN') && /^[A-Za-z0-9+/=\r\n]+$/.test(key) && key.length > 100;
  if (looksLikeBase64) {
    try {
      const decoded = Buffer.from(key, 'base64').toString('utf8').trim();
      if (decoded.includes('-----BEGIN') && decoded.includes('PRIVATE KEY-----')) {
        key = decoded;
      }
    } catch {
      // ignore decode error; will fall back to original
    }
  }

  return key;
}

function normalizePemStructure(pem: string): string {
  const begin = '-----BEGIN PRIVATE KEY-----';
  const end = '-----END PRIVATE KEY-----';
  if (!pem.includes(begin) || !pem.includes(end)) return pem;

  const startIdx = pem.indexOf(begin) + begin.length;
  const endIdx = pem.indexOf(end);
  const bodyRaw = pem.slice(startIdx, endIdx);
  const base64Body = bodyRaw.replace(/[^A-Za-z0-9+/=]/g, '');

  // Re-wrap at 64 chars per line
  const wrapped = base64Body.match(/.{1,64}/g)?.join('\n') ?? base64Body;

  return `${begin}\n${wrapped}\n${end}`;
}

type ServiceAccount = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
};

function tryParseJson<T = unknown>(value?: string | null): T | null {
  if (!value) return null;
  const trimmed = value.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}

function parseServiceAccountFromEnv(): ServiceAccount | null {
  const candidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT,
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
  ];

  for (const candidate of candidates) {
    const asJson = tryParseJson<ServiceAccount>(candidate);
    if (asJson && asJson.private_key) {
      asJson.private_key = normalizePemStructure(normalizePrivateKey(asJson.private_key) || '');
      return asJson;
    }
  }

  const base64Candidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64,
  ];

  for (const candidate of base64Candidates) {
    if (!candidate) continue;
    try {
      const decoded = Buffer.from(candidate, 'base64').toString('utf8');
      const asJson = tryParseJson<ServiceAccount>(decoded);
      if (asJson && asJson.private_key) {
        asJson.private_key = normalizePemStructure(normalizePrivateKey(asJson.private_key) || '');
        return asJson;
      }
    } catch {
      // ignore and continue
    }
  }

  return null;
}

// Debug environment variables
console.log('🔍 Environment Debug Info:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAILWAY:', process.env.RAILWAY);
console.log('VERCEL:', process.env.VERCEL);
console.log('Has FIREBASE_PROJECT_ID:', !!process.env.FIREBASE_PROJECT_ID);
console.log('Has FIREBASE_CLIENT_EMAIL:', !!process.env.FIREBASE_CLIENT_EMAIL);
console.log('Has FIREBASE_PRIVATE_KEY:', !!process.env.FIREBASE_PRIVATE_KEY);
console.log('Has FIREBASE_PRIVATE_KEY_BASE64:', !!process.env.FIREBASE_PRIVATE_KEY_BASE64);
console.log('Has FIREBASE_SERVICE_ACCOUNT_JSON:', !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
console.log('Has FIREBASE_SERVICE_ACCOUNT_BASE64:', !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64);
console.log('Has GOOGLE_APPLICATION_CREDENTIALS_JSON:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
console.log('Has GOOGLE_APPLICATION_CREDENTIALS_BASE64:', !!process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64);
console.log('FIREBASE_PROJECT_ID value:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL value:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY?.length);

// Clean private key - robust processing
// Prefer base64 variant if present to avoid newline mangling by platforms
let privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY_BASE64)
  || normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (privateKey) {
  // Rebuild PEM structure to avoid ASN.1 errors due to wrapping
  privateKey = normalizePemStructure(privateKey);
  console.log('🔧 Original key length:', process.env.FIREBASE_PRIVATE_KEY?.length || process.env.FIREBASE_PRIVATE_KEY_BASE64?.length);
  console.log('🔧 Processed key length:', privateKey.length);
  console.log('🔧 Key starts with:', privateKey.substring(0, 30));
  console.log('🔧 Key ends with:', privateKey.substring(Math.max(0, privateKey.length - 30)));
}

// Check if we're in build time and missing env vars
const serviceAccount = parseServiceAccountFromEnv();
const isBuildTime = process.env.NODE_ENV === 'production' && !privateKey && !process.env.FIREBASE_PROJECT_ID && !serviceAccount;

if (!serviceAccount) {
  if (!privateKey && !isBuildTime) {
    throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
  }

  if (!process.env.FIREBASE_PROJECT_ID && !isBuildTime) {
    throw new Error('FIREBASE_PROJECT_ID environment variable is not set');
  }

  if (!process.env.FIREBASE_CLIENT_EMAIL && !isBuildTime) {
    throw new Error('FIREBASE_CLIENT_EMAIL environment variable is not set');
  }
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

const firebaseAdminConfig = serviceAccount
  ? {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key,
    }
  : {
      projectId: process.env.FIREBASE_PROJECT_ID || 'dummy-project',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'dummy@dummy.com',
      privateKey: privateKey || 'dummy-key',
    };

console.log('🔑 Credential source:', serviceAccount
  ? (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
      ? 'service_account_json_base64'
      : process.env.FIREBASE_SERVICE_ACCOUNT_JSON
        ? 'service_account_json'
        : process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64
          ? 'google_application_credentials_base64'
          : 'google_application_credentials_json')
  : (process.env.FIREBASE_PRIVATE_KEY_BASE64 ? 'private_key_base64' : 'private_key_env'));

// Initialize Firebase Admin
let app;
try {
  // Check if Firebase Admin app is already initialized
  if (getApps().length === 0) {
    // Only initialize if we have real credentials and not during build
    if ((serviceAccount || (privateKey && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL)) && !isBuildTime) {
      console.log('🔥 Initializing Firebase Admin with credentials...');

      // Validate private key format before attempting to initialize
      const keyToValidate = firebaseAdminConfig.privateKey || '';
      if (!keyToValidate.includes('-----BEGIN PRIVATE KEY-----') || !keyToValidate.includes('-----END PRIVATE KEY-----')) {
        throw new Error('Private key format is invalid - missing BEGIN/END markers');
      }

      // Quick sanity check with Node crypto to catch ASN.1 issues early
      try {
        crypto.createPrivateKey({ key: keyToValidate, format: 'pem' });
      } catch (e) {
        throw new Error(`Private key failed crypto validation: ${(e as Error).message}`);
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

export default app;