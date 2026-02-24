importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

const STATIC_CACHE = 'refit-static-v1';
const PAGE_CACHE = 'refit-pages-v1';
const PUBLIC_API_CACHE = 'refit-public-api-v1';
const OFFLINE_URL = '/offline.html';
const SW_VERSION = '2026-02-24';

const STATIC_PATH_PREFIXES = ['/_next/static/', '/icons/', '/assets/', '/lottie/'];
const PERSONALIZED_API_PREFIXES = [
  '/bff/users/me',
  '/bff/reports',
  '/bff/resumes',
  '/bff/notifications',
  '/bff/auth',
  '/bff/uploads',
  '/bff/chat',
  '/bff/email-verifications',
];
const PUBLIC_CACHEABLE_API_PREFIXES = ['/bff/experts'];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isStaticAsset(pathname) {
  if (pathname === '/manifest.webmanifest') return true;
  if (STATIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  return /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$/i.test(pathname);
}

function isPersonalizedApi(pathname) {
  return PERSONALIZED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isPublicCacheableApi(pathname) {
  return PUBLIC_CACHEABLE_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (_error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidatePublicApi(request) {
  const cache = await caches.open(PUBLIC_API_CACHE);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) return cached;

  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;

  return new Response(JSON.stringify({ code: 'OFFLINE', message: 'OFFLINE', data: null }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll([OFFLINE_URL, '/manifest.webmanifest', '/icons/char_icon.png']),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [STATIC_CACHE, PAGE_CACHE, PUBLIC_API_CACHE];
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => !keep.includes(key)).map((key) => caches.delete(key)));
      await self.clients.claim();
      console.info(`[SW] active ${SW_VERSION}`);
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isSameOrigin(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isPersonalizedApi(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  if (isPublicCacheableApi(url.pathname)) {
    event.respondWith(staleWhileRevalidatePublicApi(request));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStatic(request));
  }
});

firebase.initializeApp({
  apiKey: 'AIzaSyAo7dKGeFu0AcFfpUI42eTr-HWoEsSwQcg',
  authDomain: 're-fit-cf52c.firebaseapp.com',
  projectId: 're-fit-cf52c',
  storageBucket: 're-fit-cf52c.firebasestorage.app',
  messagingSenderId: '1050669409503',
  appId: '1:1050669409503:web:3123ee1c5fa8d7448ef56a',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || '알림';
  const options = {
    body: payload.notification?.body || '',
    icon: '/icons/char_icon.png',
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const existing = windowClients.find((client) => 'focus' in client);
        if (existing) {
          existing.focus();
          existing.postMessage({ type: 'FCM_NOTIFICATION_CLICK', data: event.notification.data });
          return;
        }
        clients.openWindow('/');
      }),
  );
});
