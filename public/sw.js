const CACHE = "fmf-v3";
const RECIPE_CACHE = "fmf-recipes";
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

// Activate — remove old caches (keep recipe cache)
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== RECIPE_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — stale-while-revalidate for static, network-first for pages
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (Supabase, Google, etc.)
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Next.js static assets — cache-first (immutable hashed filenames)
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // Skip other _next routes (data, image optimization, etc.)
  if (url.pathname.startsWith("/_next/")) return;

  // API routes — network only
  if (url.pathname.startsWith("/api/")) return;

  // Static assets (sounds, icons, images, videos) — stale-while-revalidate
  if (/\.(mp3|mp4|png|jpg|jpeg|webp|svg|ico|json|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE).then((c) => c.put(request, clone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // HTML pages — network-first, fall back to cache with offline banner
  e.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(request) || await caches.match("/");
        if (!cached) return cached;
        // Inject offline banner into cached HTML response
        const html = await cached.text();
        const banner =
          '<div id="sw-offline-banner" style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#f59e0b;color:#fff;text-align:center;padding:6px 12px;font-size:14px;font-family:system-ui,sans-serif;">' +
          "You're offline — cooking mode still works!" +
          "</div>";
        const injected = html.replace("</head>", "</head>" + banner);
        return new Response(injected, {
          status: cached.status,
          statusText: cached.statusText,
          headers: cached.headers,
        });
      })
  );
});

// Push notifications
self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? { title: "Fork My Feels", body: "What's your mood today?" };
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

// Timer notifications — triggered by the page when a cook timer starts
let _timerTimeout = null;
let _halfwayTimeout = null;

self.addEventListener("message", (e) => {
  if (e.data?.type === "TIMER_SET") {
    const { endTime, recipeName, minutes } = e.data;
    const delay = endTime - Date.now();
    if (delay <= 0) return;

    clearTimeout(_timerTimeout);
    clearTimeout(_halfwayTimeout);

    // Halfway reminder (only for timers longer than 2 minutes)
    if (minutes > 2) {
      _halfwayTimeout = setTimeout(() => {
        const halfLeft = Math.round(minutes / 2);
        self.registration.showNotification("Halfway there!", {
          body: `About ${halfLeft} minute${halfLeft !== 1 ? "s" : ""} left on ${recipeName || "your recipe"}`,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: "timer-halfway",
        });
      }, delay / 2);
    }

    // Done notification
    _timerTimeout = setTimeout(() => {
      self.registration.showNotification("Timer Done!", {
        body: `${recipeName || "Your recipe"} is ready! Time to plate up`,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "timer-done",
        requireInteraction: true,
      });
    }, delay);
  }

  if (e.data?.type === "TIMER_CLEAR") {
    clearTimeout(_timerTimeout);
    clearTimeout(_halfwayTimeout);
  }

  // Cache recipe data for offline cooking mode
  if (e.data?.type === "CACHE_RECIPE") {
    const recipe = e.data.recipe;
    if (!recipe) return;
    e.waitUntil(
      (async () => {
        const cache = await caches.open(RECIPE_CACHE);
        // Store recipe data as a synthetic JSON response
        const recipeResponse = new Response(JSON.stringify(recipe), {
          headers: { "Content-Type": "application/json" },
        });
        await cache.put(
          new Request(`/offline-recipe/${recipe.id}`),
          recipeResponse
        );
        // Pre-cache the cooking video so it's available offline
        try {
          const videoRequest = new Request("/videos/rascal-cooking.mp4");
          const existing = await cache.match(videoRequest);
          if (!existing) {
            const videoResponse = await fetch(videoRequest);
            if (videoResponse.ok) {
              await cache.put(videoRequest, videoResponse);
            }
          }
        } catch (err) {
          // Video pre-cache is best-effort; don't block recipe caching
          console.warn("SW: failed to pre-cache cooking video", err);
        }
      })()
    );
  }

  // Clear the recipe cache
  if (e.data?.type === "CLEAR_RECIPE_CACHE") {
    e.waitUntil(caches.delete(RECIPE_CACHE));
  }
});
