const CACHE = "fmf-v1";
const OFFLINE_ASSETS = [
  "/",
  "/manifest.json",
  "/rascal-fallback.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/sounds/click.mp3",
  "/sounds/chime.mp3",
  "/sounds/bloop.mp3",
];

// Install — pre-cache shell assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_ASSETS))
  );
  self.skipWaiting();
});

// Activate — remove old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for API, cache-first for static
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (Supabase, Google, etc.)
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Skip Next.js internal routes
  if (url.pathname.startsWith("/_next/")) return;

  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          // Only cache successful opaque-safe responses
          if (res.ok || res.type === "opaque") {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => cached); // offline fallback to cache

      // Return cached instantly, update in background
      return cached || network;
    })
  );
});

// Push notifications
self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? { title: "Fork My Feels", body: "What's your mood today? 🍴" };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", () => {
  self.clients.openWindow("/");
});
