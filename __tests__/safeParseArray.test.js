// Test the safeParseArray function used across the app

// Replicate the function (it's defined inline in page.js and profile/page.js)
function safeParseArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    try { localStorage.removeItem(key); } catch {}
    return [];
  }
}

describe("safeParseArray", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test("returns empty array when key does not exist", () => {
    expect(safeParseArray("nonexistent")).toEqual([]);
  });

  test("returns empty array for null value", () => {
    localStorage.setItem("test", "null");
    expect(safeParseArray("test")).toEqual([]);
  });

  test("returns empty array for non-array JSON (object)", () => {
    localStorage.setItem("test", '{"foo":"bar"}');
    expect(safeParseArray("test")).toEqual([]);
  });

  test("returns empty array for non-array JSON (string)", () => {
    localStorage.setItem("test", '"hello"');
    expect(safeParseArray("test")).toEqual([]);
  });

  test("returns empty array for non-array JSON (number)", () => {
    localStorage.setItem("test", "42");
    expect(safeParseArray("test")).toEqual([]);
  });

  test("parses valid array correctly", () => {
    const data = [{ id: 1, name: "Pasta" }, { id: 2, name: "Cake" }];
    localStorage.setItem("test", JSON.stringify(data));
    expect(safeParseArray("test")).toEqual(data);
  });

  test("returns empty array for corrupted JSON and removes the key", () => {
    localStorage.setItem("test", "{not valid json[[[");
    expect(safeParseArray("test")).toEqual([]);
    expect(localStorage.removeItem).toHaveBeenCalledWith("test");
  });

  test("returns empty array for empty string", () => {
    localStorage.setItem("test", "");
    // Empty string is falsy, so raw check returns []
    // Actually empty string is falsy in JS: !raw is true
    expect(safeParseArray("test")).toEqual([]);
  });

  test("handles empty array correctly", () => {
    localStorage.setItem("test", "[]");
    expect(safeParseArray("test")).toEqual([]);
  });
});
