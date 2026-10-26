// Udaan Mission Service Worker for Low-Bandwidth and Offline Learning
const CACHE_NAME = "udaan-learning-cache-v1";
const OFFLINE_URLS = [
  "/",
  "/udaan",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS).catch((err) => {
        console.warn("[SW] Cache preload partial failure:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Let real-time AI and dynamic write API requests bypass cache
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/chat") || url.pathname.startsWith("/api/classroom-ai")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return cached version if found
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is HTML, fallback to cached Udaan shell
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/udaan") || caches.match("/");
          }
          return cached;
        });

      return cached || fetchPromise;
    })
  );
});
