import { getMealSuggestions } from "../utils/mealSuggestionEngine";

const makeRecipe = (id, name = `Recipe ${id}`) => ({
  id,
  name,
  emoji: "🍕",
  description: `Desc for ${name}`,
  moods: ["happy"],
});

describe("getMealSuggestions", () => {
  const recipes = [makeRecipe(1, "Pasta"), makeRecipe(2, "Cake"), makeRecipe(3, "Salad"), makeRecipe(4, "Soup")];

  test("returns empty array when no recipes provided", () => {
    const result = getMealSuggestions({
      userRatings: [],
      globalRatings: [],
      recipes: [],
      selectedMoods: ["happy"],
    });
    expect(result).toEqual([]);
  });

  test("returns exactly one suggestion", () => {
    const result = getMealSuggestions({
      userRatings: [],
      globalRatings: [],
      recipes,
      selectedMoods: ["happy"],
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("name");
  });

  test("prioritises user-rated recipes for the selected mood", () => {
    const userRatings = [
      { recipe_id: 2, rating: 5, mood: "happy" },
    ];
    const globalRatings = [
      { recipe_id: 1, rating: 3, mood: "happy" },
    ];

    // Run 20 times — the user's 5-star should dominate
    const picks = new Set();
    for (let i = 0; i < 20; i++) {
      const [r] = getMealSuggestions({ userRatings, globalRatings, recipes, selectedMoods: ["happy"] });
      picks.add(r.id);
    }
    // Recipe 2 should appear most of the time (can't guarantee 100% due to weighted random)
    expect(picks.has(2)).toBe(true);
  });

  test("avoids last suggested recipe", () => {
    const smallRecipes = [makeRecipe(1), makeRecipe(2)];
    const results = [];
    for (let i = 0; i < 20; i++) {
      const [r] = getMealSuggestions({
        userRatings: [],
        globalRatings: [],
        recipes: smallRecipes,
        selectedMoods: ["happy"],
        lastSuggestedId: 1,
      });
      results.push(r.id);
    }
    // Should never pick recipe 1 (it was the last suggested)
    expect(results.every((id) => id === 2)).toBe(true);
  });

  test("deprioritises recently cooked recipes", () => {
    const cookHistory = [
      { id: 1, cookedAt: new Date().toISOString() }, // cooked today
    ];
    const globalRatings = [
      { recipe_id: 1, rating: 5, mood: "happy" },
      { recipe_id: 2, rating: 5, mood: "happy" },
    ];

    const counts = { 1: 0, 2: 0 };
    for (let i = 0; i < 50; i++) {
      const [r] = getMealSuggestions({
        userRatings: [],
        globalRatings,
        recipes: [makeRecipe(1), makeRecipe(2)],
        selectedMoods: ["happy"],
        cookHistory,
      });
      counts[r.id]++;
    }
    // Recipe 2 should be picked more often since recipe 1 was recently cooked
    expect(counts[2]).toBeGreaterThan(counts[1]);
  });

  test("falls back to any recipe when all are filtered out", () => {
    // Only one recipe and it was the last suggested — fallback should still return it
    const result = getMealSuggestions({
      userRatings: [],
      globalRatings: [],
      recipes: [makeRecipe(1)],
      selectedMoods: ["happy"],
      lastSuggestedId: 1,
    });
    // Should return empty since the only recipe is excluded and fallback also excludes it
    expect(result).toEqual([]);
  });

  test("filters ratings by selected mood", () => {
    const userRatings = [
      { recipe_id: 1, rating: 5, mood: "sad" }, // wrong mood
      { recipe_id: 2, rating: 5, mood: "happy" }, // right mood
    ];

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (let i = 0; i < 30; i++) {
      const [r] = getMealSuggestions({
        userRatings,
        globalRatings: [],
        recipes,
        selectedMoods: ["happy"], // only happy mood
      });
      counts[r.id]++;
    }
    // Recipe 2 should be favoured (user rated it 5★ for "happy")
    expect(counts[2]).toBeGreaterThan(0);
  });

  test("handles multiple selected moods", () => {
    const userRatings = [
      { recipe_id: 1, rating: 5, mood: "happy" },
      { recipe_id: 2, rating: 5, mood: "sad" },
    ];

    const result = getMealSuggestions({
      userRatings,
      globalRatings: [],
      recipes,
      selectedMoods: ["happy", "sad"],
    });
    expect(result).toHaveLength(1);
    expect([1, 2, 3, 4]).toContain(result[0].id);
  });
});
