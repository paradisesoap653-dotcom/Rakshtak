const CACHE_NAME = 'rakshatak-pwa-v3'; // تم تحديث الإصدار لتفريغ الكاش القديم بعد تغيير اللوجو

const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
];

const APP_ICON = 'https://oskpxioxasyyfyhpbqkv.supabase.co/storage/v1/object/public/Picture/icon.png';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// ------------------------------------------------------------
// استقبال إشعارات Push حقيقية — تظهر حتى لو التطبيق مقفول تماماً
// ------------------------------------------------------------
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'ركشتك 🛺', body: event.data ? event.data.text() : 'لديك تحديث جديد' };
  }

  const title = data.title || 'ركشتك 🛺';
  const options = {
    body: data.body || 'لديك تحديث جديد',
    icon: data.icon || APP_ICON,
    badge: data.badge || APP_ICON,
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    data: { ride_id: data.ride_id || null, target: data.target || null },
    tag: data.ride_id ? `ride-${data.ride_id}` : undefined,
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// عند الضغط على الإشعار، نفتح الصفحة المناسبة (لوحة السائق أو صفحة الراكب)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const target = event.notification.data?.target;
  const targetUrl = target === 'driver' ? '/driver' : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
