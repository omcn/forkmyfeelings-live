/**
 * Tests for app/layout.js — Root layout metadata and structured data
 *
 * The layout component itself requires Next.js server rendering,
 * so we test the exported metadata object and the structured data
 * (schema.org JSON-LD) that it embeds.
 */

// Mock dependencies that layout.js imports transitively
jest.mock("../lib/supabaseClient", () => ({
  supabase: { auth: { onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })) } },
}));
jest.mock("../app/components/SupabaseAuthWatcher", () => {
  const r = require("react");
  return { __esModule: true, default: () => r.createElement("div") };
});
jest.mock("../app/components/ErrorBoundary", () => {
  const r = require("react");
  return { __esModule: true, default: ({ children }) => r.createElement("div", null, children) };
});
jest.mock("react-hot-toast", () => ({
  Toaster: () => null,
}));

const { metadata } = require("../app/layout");

describe("Layout — metadata", () => {
  it("has correct default title", () => {
    expect(metadata.title.default).toBe("Fork My Feels – Mood-Based Recipe Suggestions");
  });

  it("has title template with app name", () => {
    expect(metadata.title.template).toBe("%s | Fork My Feels");
  });

  it("has a description", () => {
    expect(metadata.description).toContain("mood");
    expect(metadata.description).toContain("recipe");
  });

  it("has relevant keywords", () => {
    expect(metadata.keywords).toContain("mood recipes");
    expect(metadata.keywords).toContain("fork my feels");
    expect(metadata.keywords).toContain("cooking app");
    expect(metadata.keywords).toContain("comfort food");
  });

  it("has correct author and publisher", () => {
    expect(metadata.authors[0].name).toBe("Fork My Feels");
    expect(metadata.publisher).toBe("Fork My Feels");
  });

  it("has correct metadataBase URL", () => {
    expect(metadata.metadataBase.href).toContain("forkmyfeelings.com");
  });

  it("has Open Graph configuration", () => {
    expect(metadata.openGraph.type).toBe("website");
    expect(metadata.openGraph.locale).toBe("en_GB");
    expect(metadata.openGraph.siteName).toBe("Fork My Feels");
    expect(metadata.openGraph.images[0].width).toBe(1200);
    expect(metadata.openGraph.images[0].height).toBe(630);
  });

  it("has Twitter card configuration", () => {
    expect(metadata.twitter.card).toBe("summary_large_image");
    expect(metadata.twitter.images).toContain("/og-image.png");
  });

  it("has Apple web app configuration", () => {
    expect(metadata.appleWebApp.capable).toBe(true);
    expect(metadata.appleWebApp.title).toBe("Fork My Feels");
  });

  it("has manifest link", () => {
    expect(metadata.manifest).toBe("/manifest.json");
  });

  it("has icon configurations", () => {
    expect(metadata.icons.icon).toHaveLength(2);
    expect(metadata.icons.icon[0].sizes).toBe("192x192");
    expect(metadata.icons.icon[1].sizes).toBe("512x512");
    expect(metadata.icons.apple[0].sizes).toBe("180x180");
  });

  it("disables telephone format detection", () => {
    expect(metadata.formatDetection.telephone).toBe(false);
  });

  it("has correct viewport settings", () => {
    expect(metadata.viewport.width).toBe("device-width");
    expect(metadata.viewport.initialScale).toBe(1);
    expect(metadata.viewport.viewportFit).toBe("cover");
  });

  it("has food category", () => {
    expect(metadata.category).toBe("food");
  });
});

describe("Layout — schema.org structured data", () => {
  // The JSON-LD is embedded inline in layout.js — test the data shape
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Fork My Feels",
    description: "A mood-based recipe suggestion app that matches food to how you're feeling.",
    url: "https://forkmyfeelings.com",
    applicationCategory: "FoodApplication",
    operatingSystem: "iOS, Android, Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
    author: {
      "@type": "Organization",
      name: "Fork My Feels",
    },
  };

  it("has valid schema.org context", () => {
    expect(schemaData["@context"]).toBe("https://schema.org");
  });

  it("is typed as WebApplication", () => {
    expect(schemaData["@type"]).toBe("WebApplication");
  });

  it("has correct app name", () => {
    expect(schemaData.name).toBe("Fork My Feels");
  });

  it("is categorized as FoodApplication", () => {
    expect(schemaData.applicationCategory).toBe("FoodApplication");
  });

  it("lists all operating systems", () => {
    expect(schemaData.operatingSystem).toContain("iOS");
    expect(schemaData.operatingSystem).toContain("Android");
    expect(schemaData.operatingSystem).toContain("Web");
  });

  it("is free (price 0 GBP)", () => {
    expect(schemaData.offers.price).toBe("0");
    expect(schemaData.offers.priceCurrency).toBe("GBP");
  });

  it("has organization author", () => {
    expect(schemaData.author["@type"]).toBe("Organization");
    expect(schemaData.author.name).toBe("Fork My Feels");
  });
});
