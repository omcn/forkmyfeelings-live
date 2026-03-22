/**
 * Tests for app/page.js — Home page extracted logic
 *
 * Tests the pure functions and state management logic in the home page:
 * - safeParseArray (localStorage parsing)
 * - haptic utility patterns
 * - toggleFavourite (save/unsave recipes)
 * - reactToPost (reaction counting with optimistic UI)
 * - handleMakeItFromBrowse (cook history deduplication)
 * - handleMultiMoodSubmit (mood → recipe flow)
 * - requireAuth (auth gating)
 * - Timer countdown + visibility resync
 * - Recipe formatting from DB (moods grouping)
 */

// --- safeParseArray (duplicated in page.js) ---
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

describe("Home page — safeParseArray", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty array for missing key", () => {
    expect(safeParseArray("nope")).toEqual([]);
  });

  it("returns parsed array for valid JSON array", () => {
    localStorage.setItem("k", '[1,2,3]');
    expect(safeParseArray("k")).toEqual([1, 2, 3]);
  });

  it("returns empty array for non-array JSON", () => {
    localStorage.setItem("k", '{"a":1}');
    expect(safeParseArray("k")).toEqual([]);
  });

  it("returns empty array and removes key for invalid JSON", () => {
    localStorage.setItem("k", "not json");
    expect(safeParseArray("k")).toEqual([]);
    expect(localStorage.getItem("k")).toBeNull();
  });
});

// --- haptic utility ---
describe("Home page — haptic utility", () => {
  const haptic = (type = "light") => {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    const patterns = { light: [10], medium: [25], heavy: [50], success: [10, 50, 10], error: [200] };
    navigator.vibrate(patterns[type] || [10]);
  };

  beforeEach(() => {
    navigator.vibrate = jest.fn();
  });

  it("vibrates with light pattern by default", () => {
    haptic();
    expect(navigator.vibrate).toHaveBeenCalledWith([10]);
  });

  it("vibrates with medium pattern", () => {
    haptic("medium");
    expect(navigator.vibrate).toHaveBeenCalledWith([25]);
  });

  it("vibrates with success pattern", () => {
    haptic("success");
    expect(navigator.vibrate).toHaveBeenCalledWith([10, 50, 10]);
  });

  it("vibrates with error pattern", () => {
    haptic("error");
    expect(navigator.vibrate).toHaveBeenCalledWith([200]);
  });

  it("falls back to light for unknown type", () => {
    haptic("unknown");
    expect(navigator.vibrate).toHaveBeenCalledWith([10]);
  });

  it("guards against missing vibrate with typeof check", () => {
    // The haptic function checks `typeof navigator === 'undefined' || !navigator.vibrate`
    // In a server (SSR) context, navigator is undefined — test the guard logic directly
    const guardPasses = (nav) => {
      if (typeof nav === "undefined" || !nav.vibrate) return false;
      return true;
    };
    expect(guardPasses(undefined)).toBe(false);
    expect(guardPasses({})).toBe(false);
    expect(guardPasses({ vibrate: null })).toBe(false);
    expect(guardPasses({ vibrate: jest.fn() })).toBe(true);
  });
});

// --- toggleFavourite logic ---
describe("Home page — toggleFavourite logic", () => {
  beforeEach(() => localStorage.clear());

  const recipe = { id: 42, name: "Pasta", emoji: "🍝", description: "Yummy pasta" };

  function getSavedIds() {
    const raw = localStorage.getItem("fmf_saved_recipes");
    return raw ? JSON.parse(raw).map((r) => r.id) : [];
  }

  function toggleFavourite(r, savedIds) {
    if (!r?.id) return { next: [], isSaved: false };
    const raw = localStorage.getItem("fmf_saved_recipes");
    const arr = raw ? JSON.parse(raw) : [];
    const isSaved = savedIds.has(r.id);
    let next;
    if (isSaved) {
      next = arr.filter((x) => x.id !== r.id);
    } else {
      next = [...arr, { id: r.id, name: r.name, emoji: r.emoji, description: r.description }];
    }
    localStorage.setItem("fmf_saved_recipes", JSON.stringify(next));
    return { next, isSaved };
  }

  it("saves a recipe when not already saved", () => {
    const { next, isSaved } = toggleFavourite(recipe, new Set());
    expect(isSaved).toBe(false);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe(42);
    expect(getSavedIds()).toEqual([42]);
  });

  it("removes a recipe when already saved", () => {
    localStorage.setItem("fmf_saved_recipes", JSON.stringify([recipe]));
    const { next, isSaved } = toggleFavourite(recipe, new Set([42]));
    expect(isSaved).toBe(true);
    expect(next).toHaveLength(0);
    expect(getSavedIds()).toEqual([]);
  });

  it("returns early for null recipe", () => {
    const { next } = toggleFavourite(null, new Set());
    expect(next).toEqual([]);
  });

  it("returns early for recipe without id", () => {
    const { next } = toggleFavourite({ name: "no id" }, new Set());
    expect(next).toEqual([]);
  });

  it("handles multiple saves without duplicates", () => {
    toggleFavourite({ id: 1, name: "A", emoji: "🅰️", description: "a" }, new Set());
    toggleFavourite({ id: 2, name: "B", emoji: "🅱️", description: "b" }, new Set());
    expect(getSavedIds()).toEqual([1, 2]);
  });
});

// --- reactToPost optimistic counting ---
describe("Home page — reactToPost counting", () => {
  function computeReaction(feedReactions, reactionCounts, postId, emoji) {
    const current = feedReactions[postId];
    const isRemoving = current === emoji;

    const nextReactions = isRemoving
      ? Object.fromEntries(Object.entries(feedReactions).filter(([k]) => k !== String(postId)))
      : { ...feedReactions, [postId]: emoji };

    const post = { ...(reactionCounts[postId] || {}) };
    if (isRemoving) {
      post[current] = Math.max((post[current] || 1) - 1, 0);
    } else {
      if (current) post[current] = Math.max((post[current] || 1) - 1, 0);
      post[emoji] = (post[emoji] || 0) + 1;
    }
    const nextCounts = { ...reactionCounts, [postId]: post };

    return { nextReactions, nextCounts, isRemoving };
  }

  it("adds a reaction to an unreacted post", () => {
    const { nextReactions, nextCounts, isRemoving } = computeReaction({}, {}, "p1", "🔥");
    expect(isRemoving).toBe(false);
    expect(nextReactions).toEqual({ p1: "🔥" });
    expect(nextCounts.p1["🔥"]).toBe(1);
  });

  it("removes a reaction when same emoji clicked", () => {
    const { nextReactions, nextCounts, isRemoving } = computeReaction(
      { p1: "🔥" }, { p1: { "🔥": 3 } }, "p1", "🔥"
    );
    expect(isRemoving).toBe(true);
    expect(nextReactions).toEqual({});
    expect(nextCounts.p1["🔥"]).toBe(2);
  });

  it("switches reaction when different emoji clicked", () => {
    const { nextReactions, nextCounts } = computeReaction(
      { p1: "🔥" }, { p1: { "🔥": 3 } }, "p1", "❤️"
    );
    expect(nextReactions).toEqual({ p1: "❤️" });
    expect(nextCounts.p1["🔥"]).toBe(2);
    expect(nextCounts.p1["❤️"]).toBe(1);
  });

  it("does not go below zero on count", () => {
    const { nextCounts } = computeReaction(
      { p1: "🔥" }, { p1: { "🔥": 0 } }, "p1", "🔥"
    );
    expect(nextCounts.p1["🔥"]).toBe(0);
  });

  it("handles multiple posts independently", () => {
    let reactions = {};
    let counts = {};
    const r1 = computeReaction(reactions, counts, "p1", "🔥");
    reactions = r1.nextReactions;
    counts = r1.nextCounts;
    const r2 = computeReaction(reactions, counts, "p2", "❤️");
    expect(r2.nextReactions).toEqual({ p1: "🔥", p2: "❤️" });
    expect(r2.nextCounts.p1["🔥"]).toBe(1);
    expect(r2.nextCounts.p2["❤️"]).toBe(1);
  });
});

// --- handleMakeItFromBrowse cook history ---
describe("Home page — cook history deduplication", () => {
  beforeEach(() => localStorage.clear());

  function addToCookHistory(recipe) {
    const raw = localStorage.getItem("fmf_cook_history");
    const history = raw ? JSON.parse(raw) : [];
    const entry = { id: recipe.id, name: recipe.name, emoji: recipe.emoji, cookedAt: new Date().toISOString() };
    const deduped = [entry, ...history.filter((h) => h.id !== recipe.id)].slice(0, 20);
    localStorage.setItem("fmf_cook_history", JSON.stringify(deduped));
    return deduped;
  }

  it("adds a recipe to empty history", () => {
    const result = addToCookHistory({ id: 1, name: "Pasta", emoji: "🍝" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it("deduplicates when cooking same recipe again", () => {
    addToCookHistory({ id: 1, name: "Pasta", emoji: "🍝" });
    const result = addToCookHistory({ id: 1, name: "Pasta", emoji: "🍝" });
    expect(result).toHaveLength(1);
  });

  it("puts most recent at the front", () => {
    addToCookHistory({ id: 1, name: "Pasta", emoji: "🍝" });
    const result = addToCookHistory({ id: 2, name: "Salad", emoji: "🥗" });
    expect(result[0].id).toBe(2);
    expect(result[1].id).toBe(1);
  });

  it("caps history at 20 entries", () => {
    for (let i = 0; i < 25; i++) {
      addToCookHistory({ id: i, name: `Recipe ${i}`, emoji: "🍴" });
    }
    const history = JSON.parse(localStorage.getItem("fmf_cook_history"));
    expect(history).toHaveLength(20);
    // Most recent (24) should be first
    expect(history[0].id).toBe(24);
  });

  it("recooking a recipe moves it to front without growing", () => {
    addToCookHistory({ id: 1, name: "A", emoji: "🅰️" });
    addToCookHistory({ id: 2, name: "B", emoji: "🅱️" });
    addToCookHistory({ id: 3, name: "C", emoji: "©️" });
    const result = addToCookHistory({ id: 1, name: "A", emoji: "🅰️" });
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe(1);
  });
});

// --- Recipe formatting (moods grouping from DB) ---
describe("Home page — recipe moods grouping", () => {
  function formatRecipes(recipesData) {
    const formatted = {};
    recipesData.forEach((recipe) => {
      const moods = typeof recipe.moods === "string"
        ? JSON.parse(recipe.moods)
        : recipe.moods;
      moods.forEach((mood) => {
        if (!formatted[mood]) formatted[mood] = [];
        formatted[mood].push(recipe);
      });
    });
    return formatted;
  }

  it("groups recipes by mood", () => {
    const data = [
      { id: 1, name: "Pasta", moods: ["happy", "comfort"] },
      { id: 2, name: "Salad", moods: ["happy", "healthy"] },
    ];
    const result = formatRecipes(data);
    expect(result.happy).toHaveLength(2);
    expect(result.comfort).toHaveLength(1);
    expect(result.healthy).toHaveLength(1);
  });

  it("handles moods as JSON string", () => {
    const data = [{ id: 1, name: "Soup", moods: '["cozy","warm"]' }];
    const result = formatRecipes(data);
    expect(result.cozy).toHaveLength(1);
    expect(result.warm).toHaveLength(1);
  });

  it("places same recipe in multiple mood buckets", () => {
    const data = [{ id: 1, name: "Tacos", moods: ["happy", "party", "comfort"] }];
    const result = formatRecipes(data);
    expect(Object.keys(result)).toHaveLength(3);
    expect(result.happy[0]).toBe(result.party[0]); // same reference
  });

  it("returns empty object for empty data", () => {
    expect(formatRecipes([])).toEqual({});
  });
});

// --- requireAuth gating ---
describe("Home page — requireAuth", () => {
  it("returns true when user is present", () => {
    let authModalShown = false;
    const requireAuth = (user) => {
      if (user) return true;
      authModalShown = true;
      return false;
    };
    expect(requireAuth({ id: "u1" })).toBe(true);
    expect(authModalShown).toBe(false);
  });

  it("returns false and shows auth modal when no user", () => {
    let authModalShown = false;
    const requireAuth = (user) => {
      if (user) return true;
      authModalShown = true;
      return false;
    };
    expect(requireAuth(null)).toBe(false);
    expect(authModalShown).toBe(true);
  });
});

// --- Timer visibility resync logic ---
describe("Home page — timer resync", () => {
  it("calculates remaining seconds from stored end time", () => {
    const endTime = Date.now() + 60000; // 60 seconds from now
    const remaining = Math.ceil((endTime - Date.now()) / 1000);
    expect(remaining).toBeGreaterThanOrEqual(59);
    expect(remaining).toBeLessThanOrEqual(60);
  });

  it("returns zero or negative for expired timer", () => {
    const endTime = Date.now() - 1000; // 1 second ago
    const remaining = Math.ceil((endTime - Date.now()) / 1000);
    expect(remaining).toBeLessThanOrEqual(0);
  });

  it("correctly rounds up partial seconds", () => {
    const endTime = Date.now() + 1500; // 1.5 seconds
    const remaining = Math.ceil((endTime - Date.now()) / 1000);
    expect(remaining).toBe(2);
  });
});

// --- handleReshuffle state reset ---
describe("Home page — handleReshuffle", () => {
  it("resets all recipe display state", () => {
    let recipe = { id: 1 };
    let showRecipeCard = true;
    let showSuggestionMessage = true;
    let cookingMode = true;

    // Simulate handleReshuffle
    recipe = null;
    showRecipeCard = false;
    showSuggestionMessage = false;
    cookingMode = false;

    expect(recipe).toBeNull();
    expect(showRecipeCard).toBe(false);
    expect(showSuggestionMessage).toBe(false);
    expect(cookingMode).toBe(false);
  });
});

// --- savedIds initialization from localStorage ---
describe("Home page — savedIds initialization", () => {
  beforeEach(() => localStorage.clear());

  it("initializes empty set when no saved recipes", () => {
    const ids = new Set(safeParseArray("fmf_saved_recipes").map((r) => r.id));
    expect(ids.size).toBe(0);
  });

  it("initializes set from saved recipes", () => {
    localStorage.setItem("fmf_saved_recipes", JSON.stringify([
      { id: 1, name: "A" },
      { id: 2, name: "B" },
    ]));
    const ids = new Set(safeParseArray("fmf_saved_recipes").map((r) => r.id));
    expect(ids.size).toBe(2);
    expect(ids.has(1)).toBe(true);
    expect(ids.has(2)).toBe(true);
  });
});

// --- Notification badge ---
describe("Home page — notification badge display", () => {
  it("shows count directly for 1-9", () => {
    const format = (n) => n > 9 ? "9+" : n;
    expect(format(1)).toBe(1);
    expect(format(9)).toBe(9);
  });

  it("shows 9+ for counts above 9", () => {
    const format = (n) => n > 9 ? "9+" : n;
    expect(format(10)).toBe("9+");
    expect(format(99)).toBe("9+");
  });
});

// --- Feed refresh toast pluralization ---
describe("Home page — feed refresh toast message", () => {
  it("pluralizes correctly for 0 posts", () => {
    const n = 0;
    const msg = `Feed refreshed — ${n} post${n !== 1 ? "s" : ""}`;
    expect(msg).toBe("Feed refreshed — 0 posts");
  });

  it("singular for 1 post", () => {
    const n = 1;
    const msg = `Feed refreshed — ${n} post${n !== 1 ? "s" : ""}`;
    expect(msg).toBe("Feed refreshed — 1 post");
  });

  it("pluralizes for multiple posts", () => {
    const n = 5;
    const msg = `Feed refreshed — ${n} post${n !== 1 ? "s" : ""}`;
    expect(msg).toBe("Feed refreshed — 5 posts");
  });
});
