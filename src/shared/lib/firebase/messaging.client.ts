'use client';

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let messagingPromise: Promise<Messaging | null> | null = null;

const hasRequiredConfig = () =>
  Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId,
  );

function getFirebaseApp() {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;

  if (!hasRequiredConfig()) {
    console.warn('[FCM] Firebase config is incomplete. Check NEXT_PUBLIC_FIREBASE_* env values.');
    return null;
  }

  if (!messagingPromise) {
    messagingPromise = (async () => {
      const supported = await isSupported().catch(() => false);
      if (!supported) return null;
      return getMessaging(getFirebaseApp());
    })();
  }

  return messagingPromise;
}
