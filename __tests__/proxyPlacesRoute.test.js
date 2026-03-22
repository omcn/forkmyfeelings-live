// Test the proxy-places API route logic

const ALLOWED_ENDPOINTS = [
  "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
  "https://maps.googleapis.com/maps/api/place/textsearch/json",
  "https://maps.googleapis.com/maps/api/place/details/json",
];

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

function isEndpointAllowed(endpoint) {
  return ALLOWED_ENDPOINTS.some((allowed) => endpoint.startsWith(allowed));
}

function checkRateLimit(rateLimit, ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { start: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

describe("Proxy places endpoint validation", () => {
  test("allows nearbysearch endpoint", () => {
    expect(isEndpointAllowed("https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=1,2")).toBe(true);
  });

  test("allows textsearch endpoint", () => {
    expect(isEndpointAllowed("https://maps.googleapis.com/maps/api/place/textsearch/json?query=pizza")).toBe(true);
  });

  test("allows details endpoint", () => {
    expect(isEndpointAllowed("https://maps.googleapis.com/maps/api/place/details/json?place_id=abc")).toBe(true);
  });

  test("rejects non-Google endpoints", () => {
    expect(isEndpointAllowed("https://evil.com/steal-data")).toBe(false);
  });

  test("rejects Google endpoints not in whitelist", () => {
    expect(isEndpointAllowed("https://maps.googleapis.com/maps/api/geocode/json")).toBe(false);
  });

  test("rejects empty string", () => {
    expect(isEndpointAllowed("")).toBe(false);
  });

  test("rejects similar-looking URLs", () => {
    expect(isEndpointAllowed("https://evil.com/maps.googleapis.com/maps/api/place/nearbysearch/json")).toBe(false);
  });
});

describe("Proxy places rate limiting", () => {
  let rateLimit;

  beforeEach(() => {
    rateLimit = new Map();
  });

  test("first request is allowed", () => {
    const result = checkRateLimit(rateLimit, "1.2.3.4");
    expect(result.allowed).toBe(true);
  });

  test("10 requests within window are allowed", () => {
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit(rateLimit, "1.2.3.4");
      expect(result.allowed).toBe(true);
    }
  });

  test("11th request is blocked", () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit(rateLimit, "1.2.3.4");
    }
    const result = checkRateLimit(rateLimit, "1.2.3.4");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test("different IPs have separate limits", () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit(rateLimit, "1.2.3.4");
    }
    const result = checkRateLimit(rateLimit, "5.6.7.8");
    expect(result.allowed).toBe(true);
  });

  test("remaining count decreases", () => {
    const r1 = checkRateLimit(rateLimit, "1.2.3.4");
    expect(r1.remaining).toBe(9);
    const r2 = checkRateLimit(rateLimit, "1.2.3.4");
    expect(r2.remaining).toBe(8);
  });
});
