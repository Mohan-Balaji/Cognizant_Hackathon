import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Check if we're in a browser environment and if Firebase config is available
const isClient = typeof window !== 'undefined';
const hasFirebaseConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
                         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "placeholder-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "placeholder-auth-domain",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "placeholder-project-id",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "placeholder-storage-bucket",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "placeholder-sender-id",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "placeholder-app-id",
};

// Only initialize Firebase if we have valid config and we're in a client environment
let app = null;
let auth = null;

if (isClient && hasFirebaseConfig) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.warn('Firebase initialization failed:', error);
    // Create a mock auth object that works with react-firebase-hooks
    auth = createMockAuth();
  }
} else {
  // Create a mock auth object for static export or missing config
  auth = createMockAuth();
}

// Mock auth object that provides the same interface as Firebase Auth
function createMockAuth() {
  const listeners = [];
  let currentUser = null;

  // Check if user is stored in sessionStorage (for static export)
  if (isClient) {
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        currentUser = { uid: storedUser };
      }
    } catch (e) {
      console.warn('Could not access sessionStorage:', e);
    }
  }

  return {
    currentUser,
    onAuthStateChanged: (callback) => {
      listeners.push(callback);
      // Immediately call with current state
      callback(currentUser);
      
      // Return unsubscribe function
      return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      };
    },
    signInWithEmailAndPassword: async (email, password) => {
      // For static export, simulate successful login with demo credentials
      if (email === 'demo@example.com' && password === 'demo123') {
        const user = { uid: 'demo-user-id', email };
        currentUser = user;
        if (isClient) {
          sessionStorage.setItem('user', user.uid);
        }
        listeners.forEach(callback => callback(user));
        return { user };
      }
      throw new Error('auth/invalid-credential');
    },
    createUserWithEmailAndPassword: async (email, password) => {
      // For static export, simulate successful registration
      const user = { uid: `user-${Date.now()}`, email };
      currentUser = user;
      if (isClient) {
        sessionStorage.setItem('user', user.uid);
      }
      listeners.forEach(callback => callback(user));
      return { user };
    },
    signOut: async () => {
      currentUser = null;
      if (isClient) {
        sessionStorage.removeItem('user');
      }
      listeners.forEach(callback => callback(null));
    },
    // Add other methods that might be needed
    updateProfile: async () => {},
    sendPasswordResetEmail: async () => {},
  };
}

// Create app object for compatibility
if (!app) {
  app = { name: 'fallback-app' };
}

export { app, auth };