const CACHE_NAME = 'trangchu-noibo-v1';
const APP_SHELL = [
  './',
  './index.html',
  './admin.html',
  './hang-loi/',
  './hang-loi/index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(() => null)
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then(res => res || caches.match('./index.html')))
  );
});

// Sẵn sàng cho Web Push sau này. Khi có server gửi push, thông báo sẽ mở vào module hàng lỗi.
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data ? event.data.text() : '' }; }

  const title = data.title || 'Có cập nhật hàng lỗi';
  const options = {
    body: data.body || data.message || 'Bấm để mở quản lý hàng lỗi',
    icon: './icons/icon-192.png',
    badge: './icons/icon-192.png',
    data: { url: data.url || './hang-loi/' }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || './hang-loi/';
  event.waitUntil(clients.openWindow(url));
});
