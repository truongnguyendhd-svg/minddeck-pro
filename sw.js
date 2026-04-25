const CACHE_NAME = 'alcohol-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html'
];

// Cài đặt Service Worker và lưu Cache ban đầu
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Xóa Cache cũ khi có phiên bản mới
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Chiến lược: Mạng ưu tiên (Network First). Nếu mất mạng mới lôi Cache ra xài
self.addEventListener('fetch', (event) => {
  // Không cache các API gọi từ Supabase hoặc Vercel (AI)
  if (event.request.url.includes('supabase.co') || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Lưu bản mới nhất vào cache nếu thành công
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Nếu mất mạng, lấy từ Cache ra
        return caches.match(event.request);
      })
  );
});
