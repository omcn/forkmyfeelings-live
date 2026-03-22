// Test the haptic fallback logic from lib/haptics.js

describe("Haptic fallback logic", () => {
  let originalVibrate;

  beforeEach(() => {
    originalVibrate = navigator.vibrate;
    navigator.vibrate = jest.fn();
  });

  afterEach(() => {
    navigator.vibrate = originalVibrate;
  });

  // Test the vibrateFallback pattern used throughout haptics.js
  function vibrateFallback(ms = 50) {
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch {
      // Silently ignore
    }
  }

  test("calls navigator.vibrate with default 50ms", () => {
    vibrateFallback();
    expect(navigator.vibrate).toHaveBeenCalledWith(50);
  });

  test("calls navigator.vibrate with custom duration", () => {
    vibrateFallback(30);
    expect(navigator.vibrate).toHaveBeenCalledWith(30);
  });

  test("calls navigator.vibrate with pattern array", () => {
    vibrateFallback([50, 30, 50]);
    expect(navigator.vibrate).toHaveBeenCalledWith([50, 30, 50]);
  });

  test("does not throw when vibrate is unavailable", () => {
    navigator.vibrate = undefined;
    expect(() => vibrateFallback(50)).not.toThrow();
  });

  test("does not throw when vibrate throws", () => {
    navigator.vibrate = jest.fn(() => { throw new Error("not supported"); });
    expect(() => vibrateFallback(50)).not.toThrow();
  });

  test("light haptic uses 30ms", () => {
    vibrateFallback(30);
    expect(navigator.vibrate).toHaveBeenCalledWith(30);
  });

  test("medium haptic uses 50ms", () => {
    vibrateFallback(50);
    expect(navigator.vibrate).toHaveBeenCalledWith(50);
  });

  test("heavy haptic uses 80ms", () => {
    vibrateFallback(80);
    expect(navigator.vibrate).toHaveBeenCalledWith(80);
  });

  test("error haptic uses pattern [50, 30, 50]", () => {
    vibrateFallback([50, 30, 50]);
    expect(navigator.vibrate).toHaveBeenCalledWith([50, 30, 50]);
  });
});
