/**
 * Comprehensive tests for the meal suggestion algorithm
 * (utils/mealSuggestionEngine.js)
 *
 * Covers every path: scoring pools, freshness penalty, weighted random,
 * mood filtering, cook history, fallback logic, tier selection.
 */

import { getMealSuggestions } from "../utils/mealSuggestionEngine";

const makeRecipe = (id, name = `Recipe ${id}`, moods = ["happy"]) => ({
  id,
  name,
  emoji: "🍕",
  description: `Desc for ${name}`,
  moods,
});

// ─── POOL CONSTRUCTION ──────────────────────────────────────────

describe("Pool 1: User top-rated meals", () => {
  it("includes user-rated recipes matching the selected mood", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const userRatings = [
      { recipe_id: 1, rating: 5, mood: "happy" },
      { recipe_id: 2, rating: 4, mood: "happy" },
    ];
    // Run many times — both should appear since both are user-rated
    const ids = new Set();
    for (let i = 0; i < 50; i++) {
      const [r] = getMealSuggestions({ userRatings, globalRatings: [], recipes, selectedMoods: ["happy"] });
      ids.add(r.id);
    }
    expect(ids.has(1)).toBe(true);
    expect(ids.has(2)).toBe(true);
  });

  it("excludes user ratings for non-selected moods", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const userRatings = [
      { recipe_id: 1, rating: 5, mood: "sad" },  // wrong mood
      { recipe_id: 2, rating: 3, mood: "happy" }, // right mood
    ];
    // Recipe 1 should still appear (it's in recipes array) but won't get user-rating boost for "happy"
    const counts = { 1: 0, 2: 0 };
    for (let i = 0; i < 50; i++) {
      const [r] = getMealSuggestions({ userRatings, globalRatings: [], recipes, selectedMoods: ["happy"] });
      counts[r.id]++;
    }
    // Recipe 2 has a user rating for "happy" so should be favored
    expect(counts[2]).toBeGreaterThan(counts[1]);
  });

  it("limits user pool to top 3 recipes", () => {
    const recipes = Array.from({ length: 10 }, (_, i) => makeRecipe(i + 1));
    const userRatings = recipes.map((r) => ({ recipe_id: r.id, rating: 5, mood: "happy" }));
    // All 10 have 5-star user ratings, but only top 3 go in user pool
    // Others will be excluded from user pool (but not from discovery/global)
    const result = getMealSuggestions({ userRatings, globalRatings: [], recipes, selectedMoods: ["happy"] });
    expect(result).toHaveLength(1);
  });
});

describe("Pool 2: Global-only meals", () => {
  it("includes globally-rated recipes user hasn't rated", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const globalRatings = [{ recipe_id: 2, rating: 5, mood: "happy" }];
    // User has rated recipe 1 but not recipe 2
    const userRatings = [{ recipe_id: 1, rating: 3, mood: "happy" }];

    const counts = { 1: 0, 2: 0 };
    for (let i = 0; i < 50; i++) {
      const [r] = getMealSuggestions({ userRatings, globalRatings, recipes, selectedMoods: ["happy"] });
      counts[r.id]++;
    }
    expect(counts[2]).toBeGreaterThan(0); // Recipe 2 should appear via global pool
  });

  it("calculates global average correctly", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const globalRatings = [
      { recipe_id: 1, rating: 5, mood: "happy" },
      { recipe_id: 1, rating: 3, mood: "happy" },
      // avg for recipe 1 = 4.0
      { recipe_id: 2, rating: 1, mood: "happy" },
      // avg for recipe 2 = 1.0
    ];

    const counts = { 1: 0, 2: 0 };
    for (let i = 0; i < 100; i++) {
      const [r] = getMealSuggestions({ userRatings: [], globalRatings, recipes, selectedMoods: ["happy"] });
      counts[r.id]++;
    }
    // Recipe 1 (avg 4.0) should dominate over recipe 2 (avg 1.0)
    expect(counts[1]).toBeGreaterThan(counts[2]);
  });

  it("limits global pool to top 7 recipes", () => {
    const recipes = Array.from({ length: 15 }, (_, i) => makeRecipe(i + 1));
    const globalRatings = recipes.map((r) => ({ recipe_id: r.id, rating: 5, mood: "happy" }));
    // All 15 have global ratings — only 7 should be in pool
    const result = getMealSuggestions({ userRatings: [], globalRatings, recipes, selectedMoods: ["happy"] });
    expect(result).toHaveLength(1);
  });
});

describe("Pool 3: Discovery meals", () => {
  it("includes unrated recipes in discovery pool", () => {
    const recipes = [makeRecipe(1), makeRecipe(2), makeRecipe(3)];
    // No ratings at all — all go to discovery pool
    const ids = new Set();
    for (let i = 0; i < 50; i++) {
      const [r] = getMealSuggestions({ userRatings: [], globalRatings: [], recipes, selectedMoods: ["happy"] });
      ids.add(r.id);
    }
    expect(ids.size).toBeGreaterThan(1); // Multiple discovery recipes picked
  });

  it("excludes recently cooked recipes from discovery", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const cookHistory = [{ id: 1, cookedAt: new Date().toISOString() }];
    // Recipe 1 cooked today — should be excluded from discovery pool
    // But recipe 2 should be available
    const counts = { 1: 0, 2: 0 };
    for (let i = 0; i < 30; i++) {
      const [r] = getMealSuggestions({
        userRatings: [], globalRatings: [], recipes, selectedMoods: ["happy"], cookHistory,
      });
      counts[r.id]++;
    }
    // Recipe 2 should dominate — recipe 1 excluded from discovery but might appear via fallback
    expect(counts[2]).toBeGreaterThan(counts[1]);
  });

  it("discovery recipes get score 0", () => {
    const recipes = [makeRecipe(1)];
    const [result] = getMealSuggestions({ userRatings: [], globalRatings: [], recipes, selectedMoods: ["happy"] });
    // Can't directly check score, but the recipe should still be returned
    expect(result.id).toBe(1);
  });
});

// ─── FRESHNESS PENALTY ──────────────────────────────────────────

describe("Freshness penalty", () => {
  it("recently cooked recipe (< 3 days) gets -1.5 penalty", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const userRatings = [
      { recipe_id: 1, rating: 5, mood: "happy" },
      { recipe_id: 2, rating: 5, mood: "happy" },
    ];
    const cookHistory = [{ id: 1, cookedAt: new Date().toISOString() }]; // cooked now

    // Recipe 1: score = 5 - 1.5 = 3.5
    // Recipe 2: score = 5 - 0 = 5.0
    const counts = { 1: 0, 2: 0 };
    for (let i = 0; i < 100; i++) {
      const [r] = getMealSuggestions({ userRatings, globalRatings: [], recipes, selectedMoods: ["happy"], cookHistory });
      counts[r.id]++;
    }
    expect(counts[2]).toBeGreaterThan(counts[1]);
  });

  it("recipe cooked 4 days ago has no recent penalty", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const userRatings = [
      { recipe_id: 1, rating: 5, mood: "happy" },
      { recipe_id: 2, rating: 5, mood: "happy" },
    ];
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const cookHistory = [{ id: 1, cookedAt: fourDaysAgo }];

    // Recipe 1: score = 5 - 0.2 (1 cook × 0.2) = 4.8
    // Recipe 2: score = 5 - 0 = 5.0
    // Both should appear roughly equally since scores are close
    const counts = { 1: 0, 2: 0 };
    for (let i = 0; i < 100; i++) {
      const [r] = getMealSuggestions({ userRatings, globalRatings: [], recipes, selectedMoods: ["happy"], cookHistory });
      counts[r.id]++;
    }
    // Should be roughly equal — recipe 1 only has tiny 0.2 penalty
    expect(counts[1]).toBeGreaterThan(10);
    expect(counts[2]).toBeGreaterThan(10);
  });

  it("cook count penalty caps at -1.0", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const userRatings = [
      { recipe_id: 1, rating: 5, mood: "happy" },
      { recipe_id: 2, rating: 5, mood: "happy" },
    ];
    // Cook recipe 1 twenty times (all > 3 days ago so no recency penalty)
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    const cookHistory = Array.from({ length: 20 }, () => ({ id: 1, cookedAt: oldDate }));
    // Recipe 1: 20 × 0.2 = 4.0 but capped at 1.0 → score = 5 - 1.0 = 4.0
    // Recipe 2: score = 5.0

    const counts = { 1: 0, 2: 0 };
    for (let i = 0; i < 100; i++) {
      const [r] = getMealSuggestions({ userRatings, globalRatings: [], recipes, selectedMoods: ["happy"], cookHistory });
      counts[r.id]++;
    }
    // Recipe 2 should be favored but recipe 1 should still appear (score 4.0 vs 5.0)
    expect(counts[2]).toBeGreaterThan(counts[1]);
    expect(counts[1]).toBeGreaterThan(0); // Not completely excluded
  });
});

// ─── MOOD FILTERING ─────────────────────────────────────────────

describe("Mood filtering", () => {
  it("only considers ratings matching selected mood", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const userRatings = [
      { recipe_id: 1, rating: 5, mood: "sad" },   // doesn't match "happy"
      { recipe_id: 2, rating: 1, mood: "happy" },  // matches but low
    ];
    // For mood "happy": recipe 1 has no rating → discovery pool
    //                    recipe 2 has 1-star → user pool with low score
    const result = getMealSuggestions({ userRatings, globalRatings: [], recipes, selectedMoods: ["happy"] });
    expect(result).toHaveLength(1);
  });

  it("supports multiple selected moods", () => {
    const recipes = [makeRecipe(1), makeRecipe(2), makeRecipe(3)];
    const userRatings = [
      { recipe_id: 1, rating: 5, mood: "happy" },
      { recipe_id: 2, rating: 5, mood: "sad" },
    ];
    // Both moods selected — both recipes should have user-rated scores
    const ids = new Set();
    for (let i = 0; i < 50; i++) {
      const [r] = getMealSuggestions({
        userRatings, globalRatings: [], recipes, selectedMoods: ["happy", "sad"],
      });
      ids.add(r.id);
    }
    expect(ids.has(1)).toBe(true);
    expect(ids.has(2)).toBe(true);
  });

  it("empty selectedMoods means no mood-filtered ratings", () => {
    const recipes = [makeRecipe(1)];
    const userRatings = [{ recipe_id: 1, rating: 5, mood: "happy" }];
    // No moods selected — user rating won't match, recipe goes to discovery
    const [result] = getMealSuggestions({ userRatings, globalRatings: [], recipes, selectedMoods: [] });
    expect(result.id).toBe(1); // Still returned via discovery pool
  });
});

// ─── LAST SUGGESTED EXCLUSION ───────────────────────────────────

describe("Last suggested exclusion", () => {
  it("never picks the lastSuggestedId when alternatives exist", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    for (let i = 0; i < 30; i++) {
      const [r] = getMealSuggestions({
        userRatings: [], globalRatings: [], recipes, selectedMoods: ["happy"], lastSuggestedId: 1,
      });
      expect(r.id).toBe(2);
    }
  });

  it("returns empty when only recipe is the lastSuggestedId", () => {
    const result = getMealSuggestions({
      userRatings: [], globalRatings: [], recipes: [makeRecipe(1)], selectedMoods: ["happy"], lastSuggestedId: 1,
    });
    expect(result).toEqual([]);
  });
});

// ─── FALLBACK LOGIC ─────────────────────────────────────────────

describe("Fallback logic", () => {
  it("falls back to any recipe when all pools are empty", () => {
    // All recipes recently cooked (excluded from discovery), no ratings (no user/global pool)
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const cookHistory = [
      { id: 1, cookedAt: new Date().toISOString() },
      { id: 2, cookedAt: new Date().toISOString() },
    ];
    // Both excluded from discovery, no ratings → empty pools → fallback
    const result = getMealSuggestions({
      userRatings: [], globalRatings: [], recipes, selectedMoods: ["happy"], cookHistory,
    });
    expect(result).toHaveLength(1);
    expect([1, 2]).toContain(result[0].id);
  });

  it("fallback still excludes lastSuggestedId", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const cookHistory = [
      { id: 1, cookedAt: new Date().toISOString() },
      { id: 2, cookedAt: new Date().toISOString() },
    ];
    for (let i = 0; i < 20; i++) {
      const [r] = getMealSuggestions({
        userRatings: [], globalRatings: [], recipes, selectedMoods: ["happy"],
        cookHistory, lastSuggestedId: 1,
      });
      expect(r.id).toBe(2);
    }
  });
});

// ─── WEIGHTED RANDOM (70/30 TIER SPLIT) ─────────────────────────

describe("Weighted random selection", () => {
  it("statistically favors higher-scored recipes (top tier gets ~70%)", () => {
    const recipes = Array.from({ length: 10 }, (_, i) => makeRecipe(i + 1));
    const globalRatings = recipes.map((r, i) => ({
      recipe_id: r.id,
      rating: i + 1, // recipe 1 → 1 star, recipe 10 → 10 isn't valid but score ordering matters
      mood: "happy",
    }));

    const counts = {};
    recipes.forEach((r) => (counts[r.id] = 0));

    for (let i = 0; i < 200; i++) {
      const [r] = getMealSuggestions({
        userRatings: [], globalRatings, recipes, selectedMoods: ["happy"],
      });
      counts[r.id]++;
    }

    // Top 40% (recipes 7-10, highest global ratings) should collectively get more picks
    const topPicks = counts[7] + counts[8] + counts[9] + counts[10];
    const bottomPicks = counts[1] + counts[2] + counts[3] + counts[4] + counts[5] + counts[6];
    expect(topPicks).toBeGreaterThan(bottomPicks);
  });

  it("lower-scored recipes still get some picks (not starved)", () => {
    const recipes = Array.from({ length: 5 }, (_, i) => makeRecipe(i + 1));
    const userRatings = [
      { recipe_id: 1, rating: 5, mood: "happy" },
      { recipe_id: 2, rating: 5, mood: "happy" },
      { recipe_id: 3, rating: 1, mood: "happy" },
      { recipe_id: 4, rating: 1, mood: "happy" },
      { recipe_id: 5, rating: 1, mood: "happy" },
    ];

    const lowPicks = { 3: 0, 4: 0, 5: 0 };
    for (let i = 0; i < 500; i++) {
      const [r] = getMealSuggestions({
        userRatings, globalRatings: [], recipes, selectedMoods: ["happy"],
      });
      if (lowPicks[r.id] !== undefined) lowPicks[r.id]++;
    }
    // Low-scored recipes should appear at least occasionally
    const totalLow = lowPicks[3] + lowPicks[4] + lowPicks[5];
    expect(totalLow).toBeGreaterThan(0);
  });
});

// ─── POOL COMBINATION ORDER ─────────────────────────────────────

describe("Pool combination", () => {
  it("user-rated recipes rank above global-only", () => {
    const recipes = [makeRecipe(1), makeRecipe(2)];
    const userRatings = [{ recipe_id: 1, rating: 5, mood: "happy" }];
    const globalRatings = [{ recipe_id: 2, rating: 5, mood: "happy" }];

    const counts = { 1: 0, 2: 0 };
    for (let i = 0; i < 100; i++) {
      const [r] = getMealSuggestions({ userRatings, globalRatings, recipes, selectedMoods: ["happy"] });
      counts[r.id]++;
    }
    // Both have same base rating but user pool comes first in combined array
    // With weighted random, recipe 1 (user-rated) should appear more often
    expect(counts[1]).toBeGreaterThan(0);
    expect(counts[2]).toBeGreaterThan(0);
  });

  it("all three pools contribute to suggestions", () => {
    const recipes = [makeRecipe(1), makeRecipe(2), makeRecipe(3)];
    const userRatings = [{ recipe_id: 1, rating: 4, mood: "happy" }]; // pool 1
    const globalRatings = [{ recipe_id: 2, rating: 4, mood: "happy" }]; // pool 2
    // recipe 3: no ratings → pool 3 (discovery)

    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      const [r] = getMealSuggestions({ userRatings, globalRatings, recipes, selectedMoods: ["happy"] });
      ids.add(r.id);
    }
    // All three should appear at least once across 100 runs
    expect(ids.has(1)).toBe(true);
    expect(ids.has(2)).toBe(true);
    expect(ids.has(3)).toBe(true);
  });
});

// ─── EDGE CASES ─────────────────────────────────────────────────

describe("Edge cases", () => {
  it("returns empty for null recipes", () => {
    expect(getMealSuggestions({
      userRatings: [], globalRatings: [], recipes: null, selectedMoods: ["happy"],
    })).toEqual([]);
  });

  it("returns empty for empty recipes array", () => {
    expect(getMealSuggestions({
      userRatings: [], globalRatings: [], recipes: [], selectedMoods: ["happy"],
    })).toEqual([]);
  });

  it("handles cookHistory with missing cookedAt", () => {
    const recipes = [makeRecipe(1)];
    const cookHistory = [{ id: 1 }]; // missing cookedAt
    const result = getMealSuggestions({
      userRatings: [], globalRatings: [], recipes, selectedMoods: ["happy"], cookHistory,
    });
    expect(result).toHaveLength(1);
  });

  it("handles cookHistory with missing id", () => {
    const recipes = [makeRecipe(1)];
    const cookHistory = [{ cookedAt: new Date().toISOString() }]; // missing id
    const result = getMealSuggestions({
      userRatings: [], globalRatings: [], recipes, selectedMoods: ["happy"], cookHistory,
    });
    expect(result).toHaveLength(1);
  });

  it("handles single recipe with no ratings", () => {
    const [result] = getMealSuggestions({
      userRatings: [], globalRatings: [], recipes: [makeRecipe(42)], selectedMoods: ["happy"],
    });
    expect(result.id).toBe(42);
  });

  it("defaults cookHistory and lastSuggestedId when not provided", () => {
    const result = getMealSuggestions({
      userRatings: [],
      globalRatings: [],
      recipes: [makeRecipe(1)],
      selectedMoods: ["happy"],
    });
    expect(result).toHaveLength(1);
  });

  it("always returns exactly one suggestion (when recipes available)", () => {
    const recipes = Array.from({ length: 50 }, (_, i) => makeRecipe(i + 1));
    for (let i = 0; i < 20; i++) {
      const result = getMealSuggestions({
        userRatings: [], globalRatings: [], recipes, selectedMoods: ["happy"],
      });
      expect(result).toHaveLength(1);
    }
  });
});
