// mealSuggestionEngine.js

/**
 * Generates a sorted list of meal suggestions based on ratings and cook history.
 * @param {Object} params
 * @param {Array} params.userRatings - Ratings by the current user.
 * @param {Array} params.globalRatings - Ratings from all users.
 * @param {Array} params.recipes - List of recipes from your database.
 * @param {Array} params.selectedMoods - Currently selected moods.
 * @param {number|null} params.lastSuggestedId - Last recipe suggested (avoid repeat).
 * @param {Array} params.cookHistory - Array of { id, cookedAt } from localStorage.
 * @returns {Array} Sorted list of recipe suggestions.
 */
export function getMealSuggestions({
  userRatings,
  globalRatings,
  recipes,
  selectedMoods = [],
  lastSuggestedId = null,
  cookHistory = [],
}) {
  if (!recipes || recipes.length === 0) return [];

  // Build a set of recipe IDs cooked in the last 3 days (deprioritise, not exclude)
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const recentlyCookedIds = new Set(
    cookHistory
      .filter((h) => h.cookedAt && new Date(h.cookedAt).getTime() > threeDaysAgo)
      .map((h) => h.id)
  );

  // Build cook count per recipe (more cooks = slightly deprioritised to encourage variety)
  const cookCounts = {};
  cookHistory.forEach((h) => {
    if (h.id) cookCounts[h.id] = (cookCounts[h.id] || 0) + 1;
  });

  // Filter ratings by selected mood(s)
  const moodFilteredUserRatings = userRatings.filter((r) => selectedMoods.includes(r.mood));
  const moodFilteredGlobalRatings = globalRatings.filter((r) => selectedMoods.includes(r.mood));

  const userRatedMealIds = new Set(moodFilteredUserRatings.map((r) => r.recipe_id));

  const getGlobalAvg = (mealId) => {
    const matches = moodFilteredGlobalRatings.filter((r) => r.recipe_id === mealId);
    return matches.length > 0
      ? matches.reduce((sum, r) => sum + r.rating, 0) / matches.length
      : 0;
  };

  // Freshness penalty: recipes cooked recently or often score lower
  const freshnessPenalty = (mealId) => {
    if (recentlyCookedIds.has(mealId)) return 1.5; // subtract 1.5 stars if cooked in last 3 days
    const cooks = cookCounts[mealId] || 0;
    return Math.min(cooks * 0.2, 1.0); // up to -1 star for frequently cooked
  };

  // Top user-rated meals for the selected mood(s)
  const userTopMeals = recipes
    .filter((meal) => userRatedMealIds.has(meal.id) && meal.id !== lastSuggestedId)
    .map((meal) => {
      const rating = moodFilteredUserRatings.find((r) => r.recipe_id === meal.id)?.rating || 0;
      const score = rating - freshnessPenalty(meal.id);
      return { ...meal, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Top global-only meals (user hasn't rated for this mood)
  const globalOnlyMeals = recipes
    .filter(
      (meal) =>
        !userRatedMealIds.has(meal.id) &&
        moodFilteredGlobalRatings.some((r) => r.recipe_id === meal.id) &&
        meal.id !== lastSuggestedId
    )
    .map((meal) => {
      const globalAvg = getGlobalAvg(meal.id);
      const score = globalAvg - freshnessPenalty(meal.id);
      return { ...meal, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 7);

  // Unrated, never cooked meals (discovery pool)
  const discoveryMeals = recipes
    .filter(
      (meal) =>
        !userRatedMealIds.has(meal.id) &&
        !moodFilteredGlobalRatings.some((r) => r.recipe_id === meal.id) &&
        meal.id !== lastSuggestedId &&
        !recentlyCookedIds.has(meal.id)
    )
    .map((meal) => ({ ...meal, score: 0 }));

  const pool = [...userTopMeals, ...globalOnlyMeals, ...discoveryMeals];

  if (pool.length === 0) {
    // Last resort: any recipe except the last one
    const fallback = recipes.filter((r) => r.id !== lastSuggestedId);
    return fallback.length > 0 ? [fallback[Math.floor(Math.random() * fallback.length)]] : [];
  }

  // Weighted random: higher scores get more picks but lower scores still have a chance
  // Split into tiers: top 40% get 70% probability weight
  const sorted = [...pool].sort((a, b) => b.score - a.score);
  const topTier = sorted.slice(0, Math.max(1, Math.ceil(sorted.length * 0.4)));
  const restTier = sorted.slice(topTier.length);

  const roll = Math.random();
  const pickFrom = roll < 0.7 || restTier.length === 0 ? topTier : restTier;
  const randomPick = pickFrom[Math.floor(Math.random() * pickFrom.length)];
  return [randomPick];
}
