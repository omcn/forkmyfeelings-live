// import { getMealSuggestions } from '../utils/mealSuggestionEngine.js';

// const MOOD = "lazy";
// const TARGET_MEAL_ID = 42; // pretend user gave 5 stars to this for "lazy"
// const SIMULATIONS = 100;

// function getRandomMood() {
//   return MOOD; // lock it for now
// }

// function generateMockRecipes(count = 100) {
//   return Array.from({ length: count }, (_, i) => ({
//     id: i,
//     name: `Meal ${i}`,
//     description: `Meal number ${i}`,
//     emoji: ["🍕", "🍔", "🥗", "🍜"][i % 4],
//     moods: [getRandomMood()],
//   }));
// }

// function generateUserRatings() {
//   const ratings = [];

//   // Include one strong rating for the target meal and mood
//   ratings.push({
//     recipe_id: TARGET_MEAL_ID,
//     rating: 5,
//     mood: MOOD,
//     user_id: 'user_current'
//   });

//   // Add some random others
//   for (let i = 0; i < 10; i++) {
//     const id = Math.floor(Math.random() * 100);
//     if (id !== TARGET_MEAL_ID) {
//       ratings.push({
//         recipe_id: id,
//         rating: Math.random() * 5,
//         mood: MOOD,
//         user_id: 'user_current'
//       });
//     }
//   }

//   return ratings;
// }

// function generateGlobalRatings() {
//   const ratings = [];
//   for (let i = 0; i < 300; i++) {
//     ratings.push({
//       recipe_id: Math.floor(Math.random() * 100),
//       rating: Math.random() * 5,
//       mood: MOOD,
//       user_id: `user_${Math.floor(Math.random() * 10)}`
//     });
//   }
//   return ratings;
// }

// // Run simulation
// let timesTargetMealWasSuggested = 0;

// for (let sim = 0; sim < SIMULATIONS; sim++) {
//   const recipes = generateMockRecipes();
//   const userRatings = generateUserRatings();
//   const globalRatings = generateGlobalRatings();

//   const suggestions = getMealSuggestions({
//     userRatings,
//     globalRatings,
//     recipes,
//   });

//   const top5 = suggestions.slice(0, 5).map(m => m.id);

//   if (top5.includes(TARGET_MEAL_ID)) {
//     timesTargetMealWasSuggested++;
//   }
// }

// console.log(`🏁 Out of ${SIMULATIONS} runs for mood "${MOOD}":`);
// console.log(`• Meal ${TARGET_MEAL_ID} (rated 5 stars by user) appeared in top 5 suggestions ${timesTargetMealWasSuggested} times.`);
// console.log(`• Appearance rate: ${(timesTargetMealWasSuggested / SIMULATIONS * 100).toFixed(2)}%`);
import { getMealSuggestions } from '../utils/mealSuggestionEngine.js';

const MOOD = "lazy";
const TARGET_MEAL_ID = 42;
const SIMULATIONS = 100;

function getRandomMood() {
  return MOOD;
}

function generateMockRecipes(count = 300) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `Meal ${i}`,
    description: `Meal number ${i}`,
    emoji: ["🍕", "🍔", "🥗", "🍜"][i % 4],
    moods: [getRandomMood()],
  }));
}

function generateUserRatings() {
  const ratings = [];

  // Always include a 5-star for Meal 42
  ratings.push({
    recipe_id: TARGET_MEAL_ID,
    rating: 5,
    mood: MOOD,
    user_id: 'user_current'
  });

  for (let i = 0; i < 20; i++) {
    const id = Math.floor(Math.random() * 300);
    if (id !== TARGET_MEAL_ID) {
      ratings.push({
        recipe_id: id,
        rating: Math.random() * 5,
        mood: MOOD,
        user_id: 'user_current'
      });
    }
  }

  return ratings;
}

function generateGlobalRatings() {
  const ratings = [];
  for (let i = 0; i < 500; i++) {
    ratings.push({
      recipe_id: Math.floor(Math.random() * 300),
      rating: Math.random() * 5,
      mood: MOOD,
      user_id: `user_${Math.floor(Math.random() * 20)}`
    });
  }
  return ratings;
}

// Simulation stats
let meal42Count = 0;
let userRatedCount = 0;
let globalOnlyCount = 0;
let repeatCount = 0;
let lastSuggestedId = null;
const mealFrequency = new Map();

const recipes = generateMockRecipes();

for (let i = 0; i < SIMULATIONS; i++) {
  const userRatings = generateUserRatings();
  const globalRatings = generateGlobalRatings();

  const [suggested] = getMealSuggestions({
    userRatings,
    globalRatings,
    recipes,
    selectedMoods: [MOOD],
    lastSuggestedId
  });

  if (!suggested) continue;

  const id = suggested.id;

  // Track suggestion counts
  if (id === TARGET_MEAL_ID) meal42Count++;
  if (mealFrequency.has(id)) {
    mealFrequency.set(id, mealFrequency.get(id) + 1);
  } else {
    mealFrequency.set(id, 1);
  }

  // Track source
  const isUserRated = userRatings.some(r => r.recipe_id === id);
  if (isUserRated) {
    userRatedCount++;
  } else {
    globalOnlyCount++;
  }

  // Track repeats
  if (id === lastSuggestedId) {
    repeatCount++;
  }

  lastSuggestedId = id;
}

// Get most frequently suggested meals
const topMeals = [...mealFrequency.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

console.log(`🏁 Out of ${SIMULATIONS} runs for mood "${MOOD}":`);
console.log(`• Meal ${TARGET_MEAL_ID} (rated 5 stars) appeared: ${meal42Count} times (${(meal42Count / SIMULATIONS * 100).toFixed(2)}%)`);
console.log(`• Suggestions from user-rated meals: ${userRatedCount} (${(userRatedCount / SIMULATIONS * 100).toFixed(2)}%)`);
console.log(`• Suggestions from global-only meals: ${globalOnlyCount} (${(globalOnlyCount / SIMULATIONS * 100).toFixed(2)}%)`);
console.log(`• Unique meals suggested: ${mealFrequency.size}`);
console.log(`• Repeats (should be 0): ${repeatCount}`);
console.log(`• Top 5 most suggested meals:`);

topMeals.forEach(([id, count], i) => {
  console.log(`  ${i + 1}. Meal ${id} — ${count} times`);
});
