importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

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
