import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

// Export a flag to check if firebase is configured
export const isConfigured = !!apiKey || import.meta.env.VITE_AUTH_BYPASS === 'true';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

if (apiKey) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };

  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();
} else if (import.meta.env.VITE_AUTH_BYPASS === 'true') {
  // Mock objects for bypass mode
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signOut: async () => {},
    signInWithPopup: async () => {},
  } as unknown as Auth;

  db = {
    // Basic mock to prevent immediate crashes if db is accessed
  } as unknown as Firestore;
  storage = {} as unknown as FirebaseStorage;
  googleProvider = {} as unknown as GoogleAuthProvider;
  app = {} as unknown as FirebaseApp;
  console.log('Auth Bypass Enabled: Firebase is not fully configured, using mocks.');
} else {
  // Mock objects to prevent crashes when importing
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signOut: async () => {},
    signInWithPopup: async () => {},
  } as unknown as Auth;

  db = {} as unknown as Firestore;
  storage = {} as unknown as FirebaseStorage;
  googleProvider = {} as unknown as GoogleAuthProvider;
  app = {} as unknown as FirebaseApp;
  console.warn('Firebase is not configured. Missing VITE_FIREBASE_API_KEY.');
}

export { auth, db, storage, googleProvider };
