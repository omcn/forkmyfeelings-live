// Test the timer extraction logic from CookingMode.js

function extractMinutes(stepText) {
  const match = stepText.match(/(\d+)\s*(min|minutes?)/i);
  return match ? parseInt(match[1]) : null;
}

describe("extractMinutes", () => {
  test("extracts minutes from 'Cook for 10 minutes'", () => {
    expect(extractMinutes("Cook for 10 minutes")).toBe(10);
  });

  test("extracts minutes from 'Bake for 25 min'", () => {
    expect(extractMinutes("Bake for 25 min")).toBe(25);
  });

  test("extracts minutes from 'Simmer 5 mins'", () => {
    // "mins" doesn't match "min|minutes?" — this is a known limitation
    expect(extractMinutes("Simmer 5 mins")).toBe(5);
  });

  test("extracts minutes from '15 minute timer'", () => {
    expect(extractMinutes("15 minute timer")).toBe(15);
  });

  test("returns null when no time mentioned", () => {
    expect(extractMinutes("Chop the onions finely")).toBeNull();
  });

  test("returns null for empty string", () => {
    expect(extractMinutes("")).toBeNull();
  });

  test("extracts first number when multiple times mentioned", () => {
    expect(extractMinutes("Cook 10 minutes, then rest 5 minutes")).toBe(10);
  });

  test("handles 'Min' with capital M", () => {
    expect(extractMinutes("Bake for 20 Min")).toBe(20);
  });

  test("handles 'MINUTES' all caps", () => {
    expect(extractMinutes("Cook for 30 MINUTES")).toBe(30);
  });

  test("returns null for hours only", () => {
    expect(extractMinutes("Cook for 2 hours")).toBeNull();
  });

  test("extracts single digit minutes", () => {
    expect(extractMinutes("Heat for 3 minutes")).toBe(3);
  });
});
