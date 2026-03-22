// Test the rate limiter logic from app/api/proxy-places/route.js

// Replicate the rate limiter
const rateMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    rateMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

describe("Rate Limiter", () => {
  beforeEach(() => {
    rateMap.clear();
  });

  test("allows first request from new IP", () => {
    const result = checkRateLimit("192.168.1.1");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  test("allows up to 10 requests in a window", () => {
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit("192.168.1.1");
      expect(result.allowed).toBe(true);
    }
  });

  test("blocks 11th request in same window", () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit("192.168.1.1");
    }
    const result = checkRateLimit("192.168.1.1");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test("different IPs have separate limits", () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit("192.168.1.1");
    }
    // IP 1 is maxed out
    expect(checkRateLimit("192.168.1.1").allowed).toBe(false);
    // IP 2 should still work
    expect(checkRateLimit("192.168.1.2").allowed).toBe(true);
  });

  test("resets after window expires", () => {
    // Fill up the limit
    for (let i = 0; i < 10; i++) {
      checkRateLimit("192.168.1.1");
    }
    expect(checkRateLimit("192.168.1.1").allowed).toBe(false);

    // Simulate window expiry by manually updating the entry
    const entry = rateMap.get("192.168.1.1");
    entry.windowStart = Date.now() - RATE_WINDOW - 1;

    // Should be allowed again
    expect(checkRateLimit("192.168.1.1").allowed).toBe(true);
  });

  test("remaining count decrements correctly", () => {
    expect(checkRateLimit("10.0.0.1").remaining).toBe(9);
    expect(checkRateLimit("10.0.0.1").remaining).toBe(8);
    expect(checkRateLimit("10.0.0.1").remaining).toBe(7);
  });
});
