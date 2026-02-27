'use client';

import { useEffect } from 'react';

const SERVICE_WORKER_PATH = '/firebase-messaging-sw.js';

function canRegisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
  if (window.location.protocol === 'https:') return true;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!canRegisterServiceWorker()) return;

    navigator.serviceWorker.register(SERVICE_WORKER_PATH).catch((error) => {
      console.warn('[SW] register failed', error);
    });
  }, []);

  return null;
}
