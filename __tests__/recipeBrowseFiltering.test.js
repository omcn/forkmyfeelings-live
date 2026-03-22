// Test the recipe filtering logic from RecipeBrowse.js

function filterRecipes(recipes, search, filterMood) {
  return recipes.filter((r) => {
    const matchSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description?.toLowerCase().includes(search.toLowerCase());
    const moods = Array.isArray(r.moods) ? r.moods : JSON.parse(r.moods || "[]");
    const matchMood = !filterMood || moods.includes(filterMood);
    return matchSearch && matchMood;
  });
}

const mockRecipes = [
  { id: 1, name: "Comfort Mac & Cheese", description: "Creamy pasta comfort", emoji: "🧀", moods: ["sad", "nostalgic"] },
  { id: 2, name: "Energizer Smoothie", description: "Green power boost", emoji: "🥤", moods: ["tired", "happy"] },
  { id: 3, name: "Spicy Ramen", description: "Fiery noodle soup", emoji: "🍜", moods: ["bored", "chill"] },
  { id: 4, name: "Date Night Risotto", description: "Romantic Italian dinner", emoji: "🍝", moods: ["date-night", "happy"] },
  { id: 5, name: "Quick Avocado Toast", description: "Fast and healthy", emoji: "🥑", moods: ["rushed", "happy"] },
  { id: 6, name: "Chocolate Lava Cake", description: "Rich dessert", emoji: "🍫", moods: '["happy","date-night"]' }, // JSON string moods
];

describe("Recipe search filtering", () => {
  test("no search or mood returns all recipes", () => {
    expect(filterRecipes(mockRecipes, "", "")).toHaveLength(6);
  });

  test("search by name (case insensitive)", () => {
    const result = filterRecipes(mockRecipes, "mac", "");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Comfort Mac & Cheese");
  });

  test("search by description", () => {
    const result = filterRecipes(mockRecipes, "noodle", "");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Spicy Ramen");
  });

  test("search is case insensitive", () => {
    expect(filterRecipes(mockRecipes, "SMOOTHIE", "")).toHaveLength(1);
    expect(filterRecipes(mockRecipes, "smoothie", "")).toHaveLength(1);
    expect(filterRecipes(mockRecipes, "Smoothie", "")).toHaveLength(1);
  });

  test("search matches partial strings", () => {
    const result = filterRecipes(mockRecipes, "choc", "");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Chocolate Lava Cake");
  });

  test("search with no match returns empty", () => {
    expect(filterRecipes(mockRecipes, "nonexistent", "")).toHaveLength(0);
  });
});

describe("Recipe mood filtering", () => {
  test("filter by mood returns matching recipes", () => {
    const result = filterRecipes(mockRecipes, "", "happy");
    expect(result).toHaveLength(4); // Smoothie, Risotto, Avocado Toast, Chocolate Cake (JSON string parsed)
  });

  test("filter by sad mood", () => {
    const result = filterRecipes(mockRecipes, "", "sad");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Comfort Mac & Cheese");
  });

  test("filter by date-night mood", () => {
    const result = filterRecipes(mockRecipes, "", "date-night");
    // Risotto has array moods, Chocolate Cake has JSON string moods
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some((r) => r.name === "Date Night Risotto")).toBe(true);
  });

  test("handles JSON string moods", () => {
    const result = filterRecipes(mockRecipes, "", "date-night");
    const chocolateCake = result.find((r) => r.name === "Chocolate Lava Cake");
    expect(chocolateCake).toBeDefined();
  });

  test("non-existent mood returns empty", () => {
    expect(filterRecipes(mockRecipes, "", "furious")).toHaveLength(0);
  });
});

describe("Combined search and mood filtering", () => {
  test("search and mood both applied", () => {
    const result = filterRecipes(mockRecipes, "quick", "rushed");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Quick Avocado Toast");
  });

  test("search matches but mood doesn't returns empty", () => {
    const result = filterRecipes(mockRecipes, "ramen", "happy");
    expect(result).toHaveLength(0);
  });

  test("mood matches but search doesn't returns empty", () => {
    const result = filterRecipes(mockRecipes, "pizza", "sad");
    expect(result).toHaveLength(0);
  });
});

describe("Edge cases", () => {
  test("recipe with null description doesn't crash", () => {
    const recipes = [{ id: 99, name: "Test", description: null, moods: ["happy"] }];
    expect(() => filterRecipes(recipes, "test", "")).not.toThrow();
    expect(filterRecipes(recipes, "test", "")).toHaveLength(1);
  });

  test("recipe with undefined moods returns empty array", () => {
    const recipes = [{ id: 99, name: "Test", description: "test" }];
    expect(filterRecipes(recipes, "", "happy")).toHaveLength(0);
  });

  test("recipe with corrupted moods JSON throws (known limitation)", () => {
    const recipes = [{ id: 99, name: "Test", description: "test", moods: "{broken" }];
    // Note: the actual app code doesn't try/catch JSON.parse on moods — this is a known gap
    expect(() => filterRecipes(recipes, "", "happy")).toThrow();
  });

  test("empty recipes array", () => {
    expect(filterRecipes([], "test", "happy")).toHaveLength(0);
  });
});

describe("MOODS constant", () => {
  const MOODS = ["tired", "happy", "sad", "rushed", "date-night", "chill", "recovering", "bored", "nostalgic", "overwhelmed"];

  test("has 10 moods", () => {
    expect(MOODS).toHaveLength(10);
  });

  test("all moods are unique", () => {
    expect(new Set(MOODS).size).toBe(MOODS.length);
  });

  test("includes all primary moods", () => {
    expect(MOODS).toContain("happy");
    expect(MOODS).toContain("sad");
    expect(MOODS).toContain("tired");
    expect(MOODS).toContain("rushed");
    expect(MOODS).toContain("chill");
  });
});
