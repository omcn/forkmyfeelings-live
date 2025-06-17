// mealSuggestionEngine.js

/**
 * Generates a sorted list of meal suggestions based on ratings.
 * @param {Object} params
 * @param {Array} params.userRatings - Ratings by the current user.
 * @param {Array} params.globalRatings - Ratings from all users.
 * @param {Array} params.recipes - List of recipes from your database.
 * @returns {Array} Sorted list of recipe suggestions.
 */
// utils/mealSuggestionEngine.js

// utils/mealSuggestionEngine.js

export function getMealSuggestions({
    userRatings,
    globalRatings,
    recipes,
    selectedMoods = [],
    lastSuggestedId = null
  }) {
    // console.log("🔍 Engine output:", suggestion);
    if (!recipes || recipes.length === 0) return [];
  
    // ✅ Filter ratings by selected mood(s)
    const moodFilteredUserRatings = userRatings.filter(r => selectedMoods.includes(r.mood));
    const moodFilteredGlobalRatings = globalRatings.filter(r => selectedMoods.includes(r.mood));
  
    const userRatedMealIds = new Set(moodFilteredUserRatings.map(r => r.recipe_id));
  
    const getGlobalAvg = (mealId) => {
      const matches = moodFilteredGlobalRatings.filter(r => r.recipe_id === mealId);
      return matches.length > 0
        ? matches.reduce((sum, r) => sum + r.rating, 0) / matches.length
        : 0;
    };
  
    // 🧠 Top user-rated meals for the selected mood(s)
    const userTopMeals = recipes
      .filter(meal => userRatedMealIds.has(meal.id) && meal.id !== lastSuggestedId)
      .map(meal => {
        const rating = moodFilteredUserRatings.find(r => r.recipe_id === meal.id)?.rating || 0;
        return { ...meal, score: rating };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  
    // 🌍 Top global-only meals
    const globalOnlyMeals = recipes
      .filter(meal =>
        !userRatedMealIds.has(meal.id) &&
        moodFilteredGlobalRatings.some(r => r.recipe_id === meal.id) &&
        meal.id !== lastSuggestedId
      )
      .map(meal => {
        const globalAvg = getGlobalAvg(meal.id);
        return { ...meal, score: globalAvg };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 7);
  
    const pool = [...userTopMeals, ...globalOnlyMeals];
    if (pool.length === 0) {
        const fallback = recipes.filter(r => r.id !== lastSuggestedId);
        const randomFallback = fallback[Math.floor(Math.random() * fallback.length)];
        return randomFallback ? [randomFallback] : [];
      }
      
  
    const randomPick = pool[Math.floor(Math.random() * pool.length)];
    return [randomPick];
  }
  