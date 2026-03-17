// In-memory rate limiter (per IP, resets on deploy)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

// Allowed Google Maps endpoints (whitelist)
const ALLOWED_ENDPOINTS = [
  "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
  "https://maps.googleapis.com/maps/api/place/textsearch/json",
  "https://maps.googleapis.com/maps/api/place/details/json",
];

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { start: now, count: 1 });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up old entries every 5 minutes to prevent memory leaks
if (typeof globalThis._rateLimitCleanup === "undefined") {
  globalThis._rateLimitCleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimit) {
      if (now - entry.start > RATE_LIMIT_WINDOW * 2) {
        rateLimit.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

export async function GET(req) {
  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again in a minute." }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    });
  }

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");

  // Validate the endpoint is an allowed Google Maps API URL
  if (!endpoint) {
    return new Response(JSON.stringify({ error: "Missing endpoint parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isAllowed = ALLOWED_ENDPOINTS.some((allowed) => endpoint.startsWith(allowed));
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "Endpoint not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${endpoint}&key=${apiKey}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Upstream API error" }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    if (err.name === "AbortError") {
      return new Response(JSON.stringify({ error: "Request timed out" }), {
        status: 504,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Failed to fetch places" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
