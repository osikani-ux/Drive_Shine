import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { collection, doc, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
};

export const firebaseAdminEmail = (import.meta.env.VITE_FIREBASE_ADMIN_EMAIL || '').trim().toLowerCase();
export const firebaseConfigured = Object.values(firebaseConfig).every(value => typeof value === 'string' && value.length > 0)
  && firebaseAdminEmail.length > 0;

const app = firebaseConfigured ? initializeApp(firebaseConfig) : null;

export const firebaseAuth = app ? getAuth(app) : null;
export const firestore = app ? getFirestore(app) : null;
export const appStateRef = firestore ? doc(firestore, 'appState', 'main') : null;
export const websiteBookingsRef = firestore ? collection(firestore, 'websiteBookings') : null;
export const contactMessagesRef = firestore ? collection(firestore, 'contactMessages') : null;

export function requireFirebase<T>(value: T | null, service: string): T {
  if (!value) throw new Error(`Firebase ${service} is not configured. Check the VITE_FIREBASE_* settings.`);
  return value;
}
