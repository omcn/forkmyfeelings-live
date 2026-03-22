// Test the eat-out page logic: mood mapping, URL generation, saved places

const moodFilters = [
  { key: "all", label: "🍽️ All", search: "restaurants" },
  { key: "cozy", label: "🛋️ Cozy", search: "cafe" },
  { key: "romantic", label: "💘 Date Night", search: "fine dining" },
  { key: "coffee", label: "☕ Coffee", search: "coffee shop" },
  { key: "brunch", label: "🥞 Brunch", search: "brunch" },
  { key: "healthy", label: "🥗 Healthy", search: "salad bar" },
  { key: "fast", label: "🍔 Quick Bites", search: "fast food" },
  { key: "spicy", label: "🌶️ Spicy", search: "thai food" },
  { key: "dessert", label: "🍰 Dessert", search: "bakery" },
  { key: "bar", label: "🍸 Drinks", search: "cocktail bar" },
  { key: "international", label: "🌍 World Food", search: "world cuisine" },
  { key: "diner", label: "🍳 Diner", search: "diner" },
  { key: "steakhouse", label: "🥩 Steak", search: "steakhouse" },
  { key: "sushi", label: "🍣 Sushi", search: "sushi" },
  { key: "pizza", label: "🍕 Pizza", search: "pizza" },
  { key: "chinese", label: "🥡 Chinese", search: "chinese food" },
  { key: "indian", label: "🍛 Indian", search: "indian food" },
  { key: "mexican", label: "🌮 Mexican", search: "mexican food" },
];

const moodToFilter = {
  tired: "coffee", sleepy: "coffee",
  happy: "dessert", joyful: "dessert",
  sad: "cozy", heartbroken: "cozy",
  anxious: "cozy", stressed: "cozy",
  romantic: "romantic", flirty: "romantic", "date-night": "romantic",
  calm: "coffee", peaceful: "coffee",
  bored: "fast", curious: "international",
  adventurous: "international",
  angry: "spicy", hangry: "fast",
  focused: "healthy", productive: "healthy",
  social: "bar", celebrating: "steakhouse",
  nostalgic: "diner", lonely: "diner",
  lazy: "brunch", chill: "brunch",
  overwhelmed: "cozy", recovering: "cozy",
  rushed: "fast", excited: "dessert", energetic: "bar",
};

function buildAppleMapsUrl(searchTerm, location) {
  return `https://maps.apple.com/?q=${encodeURIComponent(searchTerm + " near me")}&sll=${location.lat},${location.lng}&spn=0.05,0.05&z=14`;
}

function savePlace(filter, savedPlaces) {
  const place = {
    id: `${filter.key}-${Date.now()}`,
    label: filter.label,
    search: filter.search,
    savedAt: new Date().toISOString(),
  };
  return [place, ...savedPlaces.filter((p) => p.search !== filter.search)].slice(0, 20);
}

function removeSavedPlace(id, savedPlaces) {
  return savedPlaces.filter((p) => p.id !== id);
}

describe("Mood to filter mapping", () => {
  test("tired maps to coffee", () => {
    expect(moodToFilter.tired).toBe("coffee");
  });

  test("sad maps to cozy", () => {
    expect(moodToFilter.sad).toBe("cozy");
  });

  test("date-night maps to romantic", () => {
    expect(moodToFilter["date-night"]).toBe("romantic");
  });

  test("rushed maps to fast", () => {
    expect(moodToFilter.rushed).toBe("fast");
  });

  test("all mapped filter keys exist in moodFilters", () => {
    const filterKeys = new Set(moodFilters.map((f) => f.key));
    Object.values(moodToFilter).forEach((filterKey) => {
      expect(filterKeys.has(filterKey)).toBe(true);
    });
  });

  test("every mood maps to a valid filter", () => {
    Object.entries(moodToFilter).forEach(([mood, filter]) => {
      expect(filter).toBeTruthy();
      expect(typeof filter).toBe("string");
    });
  });

  test("similar moods map to same filter", () => {
    expect(moodToFilter.sad).toBe(moodToFilter.anxious);
    expect(moodToFilter.sad).toBe(moodToFilter.overwhelmed);
    expect(moodToFilter.tired).toBe(moodToFilter.sleepy);
    expect(moodToFilter.happy).toBe(moodToFilter.excited);
  });
});

describe("Mood filter definitions", () => {
  test("has 18 filters", () => {
    expect(moodFilters).toHaveLength(18);
  });

  test("each filter has key, label, and search", () => {
    moodFilters.forEach((f) => {
      expect(f).toHaveProperty("key");
      expect(f).toHaveProperty("label");
      expect(f).toHaveProperty("search");
      expect(f.key.length).toBeGreaterThan(0);
      expect(f.label.length).toBeGreaterThan(0);
      expect(f.search.length).toBeGreaterThan(0);
    });
  });

  test("all keys are unique", () => {
    const keys = moodFilters.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("first filter is 'all'", () => {
    expect(moodFilters[0].key).toBe("all");
    expect(moodFilters[0].search).toBe("restaurants");
  });

  test("search terms are concrete, not vague descriptors", () => {
    // This ensures we don't repeat the "cozy restaurant → Vietnam" bug
    const vagueTerms = ["cozy restaurant", "romantic restaurant", "quick restaurant"];
    moodFilters.forEach((f) => {
      vagueTerms.forEach((vague) => {
        expect(f.search).not.toBe(vague);
      });
    });
  });

  test("each label contains an emoji", () => {
    moodFilters.forEach((f) => {
      // Labels like "🍽️ All" start with emoji
      expect(f.label).toMatch(/[^\x00-\x7F]/); // has non-ASCII (emoji)
    });
  });
});

describe("Apple Maps URL generation", () => {
  const mockLocation = { lat: 54.5973, lng: -5.9301 }; // Belfast

  test("generates valid Apple Maps URL", () => {
    const url = buildAppleMapsUrl("cafe", mockLocation);
    expect(url).toContain("maps.apple.com");
    expect(url).toContain("cafe");
  });

  test("appends 'near me' to search term", () => {
    const url = buildAppleMapsUrl("pizza", mockLocation);
    expect(url).toContain(encodeURIComponent("pizza near me"));
  });

  test("includes sll (search lat/lng) parameter", () => {
    const url = buildAppleMapsUrl("sushi", mockLocation);
    expect(url).toContain(`sll=${mockLocation.lat},${mockLocation.lng}`);
  });

  test("includes spn (span) parameter for local results", () => {
    const url = buildAppleMapsUrl("brunch", mockLocation);
    expect(url).toContain("spn=0.05,0.05");
  });

  test("includes zoom level", () => {
    const url = buildAppleMapsUrl("coffee", mockLocation);
    expect(url).toContain("z=14");
  });

  test("encodes special characters in search term", () => {
    const url = buildAppleMapsUrl("mac & cheese", mockLocation);
    expect(url).toContain(encodeURIComponent("mac & cheese near me"));
  });

  test("handles negative longitude (western hemisphere)", () => {
    const url = buildAppleMapsUrl("pizza", { lat: 40.7128, lng: -74.006 });
    expect(url).toContain("sll=40.7128,-74.006");
  });
});

describe("Saved places management", () => {
  test("saves a place with correct structure", () => {
    const filter = { key: "pizza", label: "🍕 Pizza", search: "pizza" };
    const result = savePlace(filter, []);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("label", "🍕 Pizza");
    expect(result[0]).toHaveProperty("search", "pizza");
    expect(result[0]).toHaveProperty("savedAt");
  });

  test("deduplicates by search term", () => {
    const filter = { key: "pizza", label: "🍕 Pizza", search: "pizza" };
    const existing = [
      { id: "pizza-old", label: "🍕 Pizza", search: "pizza", savedAt: "2024-01-01" },
      { id: "sushi-1", label: "🍣 Sushi", search: "sushi", savedAt: "2024-01-01" },
    ];
    const result = savePlace(filter, existing);
    expect(result).toHaveLength(2); // replaced old pizza, kept sushi
    expect(result[0].search).toBe("pizza"); // new pizza is first
    expect(result[1].search).toBe("sushi");
  });

  test("limits saved places to 20", () => {
    const existing = Array.from({ length: 25 }, (_, i) => ({
      id: `place-${i}`,
      label: `Place ${i}`,
      search: `search-${i}`,
      savedAt: "2024-01-01",
    }));
    const filter = { key: "new", label: "New", search: "new-search" };
    const result = savePlace(filter, existing);
    expect(result).toHaveLength(20);
  });

  test("new save goes to the front", () => {
    const existing = [
      { id: "old-1", label: "Old", search: "old", savedAt: "2024-01-01" },
    ];
    const filter = { key: "new", label: "New", search: "new" };
    const result = savePlace(filter, existing);
    expect(result[0].search).toBe("new");
    expect(result[1].search).toBe("old");
  });

  test("removes a place by ID", () => {
    const places = [
      { id: "a", label: "A", search: "a" },
      { id: "b", label: "B", search: "b" },
      { id: "c", label: "C", search: "c" },
    ];
    const result = removeSavedPlace("b", places);
    expect(result).toHaveLength(2);
    expect(result.find((p) => p.id === "b")).toBeUndefined();
  });

  test("removing non-existent ID does nothing", () => {
    const places = [{ id: "a", label: "A", search: "a" }];
    const result = removeSavedPlace("z", places);
    expect(result).toHaveLength(1);
  });

  test("removing from empty array returns empty", () => {
    expect(removeSavedPlace("a", [])).toEqual([]);
  });
});
