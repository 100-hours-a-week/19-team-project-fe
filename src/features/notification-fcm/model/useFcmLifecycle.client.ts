'use client';

import { useCallback } from 'react';
import { getToken, onMessage } from 'firebase/messaging';
import { useQueryClient } from '@tanstack/react-query';

import { deleteFcmToken, notificationsQueryKey, registerFcmToken } from '@/entities/notification';
import { getFirebaseMessaging } from '@/shared/lib/firebase';
import { useToast } from '@/shared/ui/toast';

const FCM_STORAGE_KEY = 'refit.fcm.token';
const IOS_USER_AGENT_REGEX = /iphone|ipad|ipod/i;

type InitFcmOptions = {
  requestPermission?: boolean;
};

async function ensureMessagingServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  const existing = await navigator.serviceWorker.getRegistration('/');
  if (existing) return existing;
  return navigator.serviceWorker.register('/firebase-messaging-sw.js');
}

export function readStoredFcmToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(FCM_STORAGE_KEY);
}

export async function removeRegisteredFcmToken() {
  const storedToken = readStoredFcmToken();
  if (!storedToken) return;
  await deleteFcmToken(storedToken).catch(() => null);
  localStorage.removeItem(FCM_STORAGE_KEY);
}

function isIosBrowser() {
  if (typeof navigator === 'undefined') return false;
  return IOS_USER_AGENT_REGEX.test(navigator.userAgent);
}

function isStandalonePwa() {
  if (typeof window === 'undefined') return false;
  const byMatchMedia = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const byNavigator = Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return byMatchMedia || byNavigator;
}

export function useFcmLifecycle() {
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const initFcm = useCallback(async ({ requestPermission = true }: InitFcmOptions = {}) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (isIosBrowser() && !isStandalonePwa()) return;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
    if (!vapidKey) {
      console.warn('[FCM] NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing.');
      return;
    }

    const permission =
      Notification.permission === 'granted'
        ? 'granted'
        : requestPermission
          ? await Notification.requestPermission().catch(() => 'default')
          : Notification.permission;

    if (permission !== 'granted') return;

    const messaging = await getFirebaseMessaging();
    if (!messaging) return;

    const serviceWorkerRegistration = await ensureMessagingServiceWorker();
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: serviceWorkerRegistration ?? undefined,
    }).catch(() => null);

    if (!token) return;

    const storedToken = readStoredFcmToken();
    if (storedToken === token) return;

    if (storedToken && storedToken !== token) {
      await deleteFcmToken(storedToken).catch(() => null);
    }

    await registerFcmToken(token);
    localStorage.setItem(FCM_STORAGE_KEY, token);
  }, []);

  const listenForeground = useCallback(() => {
    let isCleanedUp = false;
    let unsubscribe: (() => void) | null = null;

    getFirebaseMessaging()
      .then((messaging) => {
        if (!messaging || isCleanedUp) return;
        unsubscribe = onMessage(messaging, (payload) => {
          const title = payload.notification?.title;
          const body = payload.notification?.body;
          if (title || body) {
            pushToast([title, body].filter(Boolean).join(' - '), { variant: 'success' });
          }
          queryClient.invalidateQueries({ queryKey: notificationsQueryKey });
        });
      })
      .catch(() => null);

    return () => {
      isCleanedUp = true;
      unsubscribe?.();
    };
  }, [pushToast, queryClient]);

  return { initFcm, listenForeground };
}
