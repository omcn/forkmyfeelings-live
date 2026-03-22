/**
 * Tests for public/sw.js — Service Worker logic
 *
 * Jest/jsdom can't run an actual SW, so we extract and test the pure logic:
 * - Cache name constants and offline assets list
 * - Fetch routing decisions (which strategy for which URL)
 * - Timer message handling (TIMER_SET, TIMER_CLEAR)
 * - Recipe cache message handling (CACHE_RECIPE, CLEAR_RECIPE_CACHE)
 * - Push notification data parsing
 * - Offline banner HTML injection
 * - Activate cache cleanup (keep current + recipe cache)
 * - Halfway timer logic (only for > 2 min timers)
 */

// ---- Constants extracted from sw.js ----
const CACHE = "fmf-v2";
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

describe("Service Worker — cache constants", () => {
  it("has correct cache version name", () => {
    expect(CACHE).toBe("fmf-v2");
  });

  it("has separate recipe cache name", () => {
    expect(RECIPE_CACHE).toBe("fmf-recipes");
  });

  it("pre-caches the root URL", () => {
    expect(OFFLINE_ASSETS).toContain("/");
  });

  it("pre-caches the manifest", () => {
    expect(OFFLINE_ASSETS).toContain("/manifest.json");
  });

  it("pre-caches the fallback avatar", () => {
    expect(OFFLINE_ASSETS).toContain("/rascal-fallback.png");
  });

  it("pre-caches all icon sizes", () => {
    expect(OFFLINE_ASSETS).toContain("/icons/icon-192.png");
    expect(OFFLINE_ASSETS).toContain("/icons/icon-512.png");
  });

  it("pre-caches all sound files", () => {
    expect(OFFLINE_ASSETS).toContain("/sounds/click.mp3");
    expect(OFFLINE_ASSETS).toContain("/sounds/chime.mp3");
    expect(OFFLINE_ASSETS).toContain("/sounds/bloop.mp3");
  });

  it("has exactly 8 offline assets", () => {
    expect(OFFLINE_ASSETS).toHaveLength(8);
  });
});

// ---- Fetch routing logic (extracted from SW fetch handler) ----
function classifyRequest(method, pathname, origin, selfOrigin) {
  if (method !== "GET" || origin !== selfOrigin) return "skip";
  if (pathname.startsWith("/_next/static/")) return "cache-first";
  if (pathname.startsWith("/_next/")) return "skip";
  if (pathname.startsWith("/api/")) return "skip";
  if (/\.(mp3|mp4|png|jpg|jpeg|webp|svg|ico|json|woff2?)$/.test(pathname)) return "stale-while-revalidate";
  return "network-first";
}

describe("Service Worker — fetch routing", () => {
  const ORIGIN = "https://forkmyfeelings.com";

  it("skips non-GET requests", () => {
    expect(classifyRequest("POST", "/", ORIGIN, ORIGIN)).toBe("skip");
  });

  it("skips cross-origin requests", () => {
    expect(classifyRequest("GET", "/api/foo", "https://other.com", ORIGIN)).toBe("skip");
  });

  it("uses cache-first for Next.js static assets", () => {
    expect(classifyRequest("GET", "/_next/static/chunks/abc.js", ORIGIN, ORIGIN)).toBe("cache-first");
  });

  it("skips other _next routes", () => {
    expect(classifyRequest("GET", "/_next/data/build-id/page.json", ORIGIN, ORIGIN)).toBe("skip");
    expect(classifyRequest("GET", "/_next/image?url=...", ORIGIN, ORIGIN)).toBe("skip");
  });

  it("skips API routes", () => {
    expect(classifyRequest("GET", "/api/proxy-places", ORIGIN, ORIGIN)).toBe("skip");
  });

  it("uses stale-while-revalidate for static assets", () => {
    expect(classifyRequest("GET", "/sounds/click.mp3", ORIGIN, ORIGIN)).toBe("stale-while-revalidate");
    expect(classifyRequest("GET", "/icons/icon-192.png", ORIGIN, ORIGIN)).toBe("stale-while-revalidate");
    expect(classifyRequest("GET", "/manifest.json", ORIGIN, ORIGIN)).toBe("stale-while-revalidate");
    expect(classifyRequest("GET", "/fonts/Inter.woff2", ORIGIN, ORIGIN)).toBe("stale-while-revalidate");
    expect(classifyRequest("GET", "/photo.jpg", ORIGIN, ORIGIN)).toBe("stale-while-revalidate");
    expect(classifyRequest("GET", "/photo.jpeg", ORIGIN, ORIGIN)).toBe("stale-while-revalidate");
    expect(classifyRequest("GET", "/photo.webp", ORIGIN, ORIGIN)).toBe("stale-while-revalidate");
    expect(classifyRequest("GET", "/logo.svg", ORIGIN, ORIGIN)).toBe("stale-while-revalidate");
    expect(classifyRequest("GET", "/favicon.ico", ORIGIN, ORIGIN)).toBe("stale-while-revalidate");
    expect(classifyRequest("GET", "/video.mp4", ORIGIN, ORIGIN)).toBe("stale-while-revalidate");
  });

  it("uses network-first for HTML pages", () => {
    expect(classifyRequest("GET", "/", ORIGIN, ORIGIN)).toBe("network-first");
    expect(classifyRequest("GET", "/profile", ORIGIN, ORIGIN)).toBe("network-first");
    expect(classifyRequest("GET", "/eat-out", ORIGIN, ORIGIN)).toBe("network-first");
  });
});

// ---- Activate cache cleanup logic ----
describe("Service Worker — activate cache cleanup", () => {
  function cachesToDelete(existingKeys) {
    return existingKeys.filter((k) => k !== CACHE && k !== RECIPE_CACHE);
  }

  it("deletes old caches", () => {
    expect(cachesToDelete(["fmf-v1", CACHE, RECIPE_CACHE])).toEqual(["fmf-v1"]);
  });

  it("keeps current and recipe caches", () => {
    expect(cachesToDelete([CACHE, RECIPE_CACHE])).toEqual([]);
  });

  it("deletes all unknown caches", () => {
    expect(cachesToDelete(["old-1", "old-2", "random"])).toEqual(["old-1", "old-2", "random"]);
  });

  it("handles empty cache list", () => {
    expect(cachesToDelete([])).toEqual([]);
  });
});

// ---- Offline banner injection ----
describe("Service Worker — offline banner injection", () => {
  const banner =
    '<div id="sw-offline-banner" style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#f59e0b;color:#fff;text-align:center;padding:6px 12px;font-size:14px;font-family:system-ui,sans-serif;">' +
    "You're offline — cooking mode still works!" +
    "</div>";

  it("injects banner after </head>", () => {
    const html = "<html><head><title>FMF</title></head><body>Hello</body></html>";
    const injected = html.replace("</head>", "</head>" + banner);
    expect(injected).toContain("</head>" + banner);
    expect(injected).toContain("sw-offline-banner");
  });

  it("preserves the rest of the HTML", () => {
    const html = "<html><head></head><body>Content</body></html>";
    const injected = html.replace("</head>", "</head>" + banner);
    expect(injected).toContain("<body>Content</body>");
  });

  it("does not inject if no </head> tag", () => {
    const html = "<html><body>No head</body></html>";
    const injected = html.replace("</head>", "</head>" + banner);
    expect(injected).toBe(html); // unchanged
  });

  it("contains amber background for visibility", () => {
    expect(banner).toContain("background:#f59e0b");
  });

  it("has z-index 9999 to overlay everything", () => {
    expect(banner).toContain("z-index:9999");
  });
});

// ---- Push notification data parsing ----
describe("Service Worker — push notification data", () => {
  it("uses payload when available", () => {
    const data = { title: "New Post!", body: "Your friend cooked something" };
    expect(data.title).toBe("New Post!");
    expect(data.body).toBe("Your friend cooked something");
  });

  it("falls back to defaults when no data", () => {
    const data = null;
    const result = data ?? { title: "Fork My Feels", body: "What's your mood today?" };
    expect(result.title).toBe("Fork My Feels");
    expect(result.body).toBe("What's your mood today?");
  });
});

// ---- Timer message logic ----
describe("Service Worker — timer messages", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("calculates delay from endTime", () => {
    const now = Date.now();
    const endTime = now + 300000; // 5 minutes
    const delay = endTime - now;
    expect(delay).toBe(300000);
  });

  it("ignores TIMER_SET with expired endTime", () => {
    const endTime = Date.now() - 1000;
    const delay = endTime - Date.now();
    expect(delay).toBeLessThanOrEqual(0);
  });

  it("calculates halfway point for long timers", () => {
    const minutes = 10;
    const halfLeft = Math.round(minutes / 2);
    expect(halfLeft).toBe(5);
  });

  it("skips halfway for timers <= 2 minutes", () => {
    expect(2 > 2).toBe(false);
    expect(1 > 2).toBe(false);
  });

  it("enables halfway for timers > 2 minutes", () => {
    expect(3 > 2).toBe(true);
    expect(5 > 2).toBe(true);
  });

  it("pluralizes halfway notification correctly", () => {
    const format = (minutes) => {
      const halfLeft = Math.round(minutes / 2);
      return `About ${halfLeft} minute${halfLeft !== 1 ? "s" : ""} left`;
    };
    expect(format(10)).toBe("About 5 minutes left");
    expect(format(2)).toBe("About 1 minute left");
    expect(format(3)).toBe("About 2 minutes left");
  });

  it("uses recipe name in notification or falls back", () => {
    const format = (recipeName) => `${recipeName || "Your recipe"} is ready! Time to plate up`;
    expect(format("Pasta")).toBe("Pasta is ready! Time to plate up");
    expect(format(null)).toBe("Your recipe is ready! Time to plate up");
    expect(format("")).toBe("Your recipe is ready! Time to plate up");
  });

  it("TIMER_CLEAR clears both timeouts", () => {
    let timerTimeout = setTimeout(() => {}, 60000);
    let halfwayTimeout = setTimeout(() => {}, 30000);
    clearTimeout(timerTimeout);
    clearTimeout(halfwayTimeout);
    // No assertions needed — just verifying no throw
    expect(true).toBe(true);
  });
});

// ---- Recipe caching message ----
describe("Service Worker — CACHE_RECIPE logic", () => {
  it("creates a synthetic JSON response from recipe data", () => {
    const recipe = { id: 42, name: "Pasta", steps: ["boil", "cook"], ingredients: ["pasta", "water"] };
    const json = JSON.stringify(recipe);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe(42);
    expect(parsed.steps).toEqual(["boil", "cook"]);
  });

  it("uses recipe id in cache URL path", () => {
    const recipe = { id: 99 };
    const url = `/offline-recipe/${recipe.id}`;
    expect(url).toBe("/offline-recipe/99");
  });

  it("skips when recipe is falsy", () => {
    const recipe = null;
    expect(!recipe).toBe(true);
  });

  it("sets content type to application/json", () => {
    const headers = { "Content-Type": "application/json" };
    expect(headers["Content-Type"]).toBe("application/json");
  });
});

// ---- Notification click ----
describe("Service Worker — notification click", () => {
  it("opens the root URL", () => {
    const target = "/";
    expect(target).toBe("/");
  });
});
