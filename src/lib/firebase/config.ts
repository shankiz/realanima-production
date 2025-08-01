import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Export commonly used auth functions
export { 
  applyActionCode,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCgBLuquuZDDYQKWU9NtTruUHNSy1b1awQ",
  authDomain: "realanima-ai.firebaseapp.com",
  projectId: "realanima-ai",
  storageBucket: "realanima-ai.firebasestorage.app",
  messagingSenderId: "410187899032",
  appId: "1:410187899032:web:a47f8716d7973b6fd570ed",
  measurementId: "G-CG3W9QTYVN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;