// Test the sitemap generation from app/sitemap.js
import sitemap from "../app/sitemap";

describe("Sitemap", () => {
  const entries = sitemap();

  test("returns an array", () => {
    expect(Array.isArray(entries)).toBe(true);
  });

  test("has 5 entries", () => {
    expect(entries).toHaveLength(5);
  });

  test("all entries have required fields", () => {
    entries.forEach((entry) => {
      expect(entry).toHaveProperty("url");
      expect(entry).toHaveProperty("lastModified");
      expect(entry).toHaveProperty("changeFrequency");
      expect(entry).toHaveProperty("priority");
    });
  });

  test("homepage has highest priority", () => {
    const homepage = entries.find((e) => e.url === "https://forkmyfeelings.com");
    expect(homepage).toBeDefined();
    expect(homepage.priority).toBe(1);
    expect(homepage.changeFrequency).toBe("daily");
  });

  test("all URLs use the correct base URL", () => {
    entries.forEach((entry) => {
      expect(entry.url).toMatch(/^https:\/\/forkmyfeelings\.com/);
    });
  });

  test("includes leaderboard page", () => {
    const lb = entries.find((e) => e.url.includes("/leaderboard"));
    expect(lb).toBeDefined();
    expect(lb.priority).toBe(0.7);
  });

  test("includes submit page", () => {
    const sub = entries.find((e) => e.url.includes("/submit"));
    expect(sub).toBeDefined();
    expect(sub.priority).toBe(0.6);
  });

  test("includes privacy and terms pages", () => {
    const privacy = entries.find((e) => e.url.includes("/privacy"));
    const terms = entries.find((e) => e.url.includes("/terms"));
    expect(privacy).toBeDefined();
    expect(terms).toBeDefined();
    expect(privacy.changeFrequency).toBe("yearly");
    expect(terms.changeFrequency).toBe("yearly");
  });

  test("lastModified is a Date object", () => {
    entries.forEach((entry) => {
      expect(entry.lastModified).toBeInstanceOf(Date);
    });
  });

  test("priorities are between 0 and 1", () => {
    entries.forEach((entry) => {
      expect(entry.priority).toBeGreaterThanOrEqual(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    });
  });
});
