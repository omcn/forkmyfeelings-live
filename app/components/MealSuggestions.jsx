

// import { useEffect, useState } from "react";
// import { supabase } from "../../lib/supabaseClient";  // Correct import for Supabase client

// export default function MealSuggestions({ user, selectedMoods }) {
//   const [suggestedMeals, setSuggestedMeals] = useState([]);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     // Ensure user and selectedMoods are valid
//     if (!user || selectedMoods.length === 0) return; // Stop if no user or mood selected

//     const fetchSuggestions = async () => {
//       try {
//         // Fetch ratings for the user, filtered by the selected moods
//         const { data: ratings, error: ratingsError } = await supabase
//           .from("recipe_ratings")
//           .select("recipe_id, rating, mood")
//           .eq("user_id", user.id)
//           .in("mood", selectedMoods)  // Fetch ratings for the moods selected
//           .order("rating", { ascending: false }); // Sort by rating, highest first

//         if (ratingsError) {
//           setError("Error fetching ratings: " + ratingsError.message);
//           return;
//         }

//         // Get the recipe IDs from the ratings
//         const recipeIds = ratings.map((rating) => rating.recipe_id);

//         // Fetch recipes based on the recipe IDs obtained from ratings
//         const { data: recipes, error: recipesError } = await supabase
//           .from("recipes")
//           .select("id, name, category, description, emoji, moods")
//           .in("id", recipeIds);

//         if (recipesError) {
//           setError("Error fetching recipes: " + recipesError.message);
//           return;
//         }

//         // Filter and prioritize recipes that match the selected moods
//         const filteredMeals = recipes.filter((meal) => {
//           const mealMoods = meal.moods || [];
//           return selectedMoods.some((mood) => mealMoods.includes(mood));
//         });

//         // Sort the meals by their ratings (Highest rating first)
//         const sortedMeals = filteredMeals.sort((a, b) => {
//           const ratingA = ratings.find((rating) => rating.recipe_id === a.id)?.rating || 0;
//           const ratingB = ratings.find((rating) => rating.recipe_id === b.id)?.rating || 0;
//           return ratingB - ratingA; // Sort by rating, descending
//         });

//         setSuggestedMeals(sortedMeals);  // Set the meal suggestions

//       } catch (err) {
//         setError("Error fetching meal suggestions: " + err.message);
//       }
//     };

//     fetchSuggestions();
//   }, [user, selectedMoods]); // Re-run when user or selectedMoods change

//   return (
//     <div>
//       <h2>Suggested Meals Based on Your Mood</h2>

//       {/* Error handling */}
//       {error && <p>{error}</p>}

//       {/* Meal suggestion list */}
//       <ul>
//         {suggestedMeals.length === 0 ? (
//           <p>No suggestions available based on your mood.</p>
//         ) : (
//           suggestedMeals.map((meal) => (
//             <li key={meal.id}>
//               <h3>{meal.name}</h3>
//               <p>{meal.description}</p>
//               <p>{meal.emoji}</p>
//             </li>
//           ))
//         )}
//       </ul>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function MealSuggestions({ user, selectedMoods }) {
  const [suggestedMeals, setSuggestedMeals] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || selectedMoods.length === 0) return; // Stop if no user or mood selected

    const fetchSuggestions = async () => {
      try {
        // Step 1: Fetch global ratings for the selected moods
        const { data: globalRatings, error: globalError } = await supabase
          .from("recipe_ratings")
          .select("recipe_id, rating, mood")
          .in("mood", selectedMoods)  // Filter by selected moods
          .order("rating", { ascending: false });

        if (globalError) {
          setError("Error fetching global ratings: " + globalError.message);
          return;
        }

        // Get global recipe IDs (from other users' ratings)
        const globalRecipeIds = globalRatings.map((rating) => rating.recipe_id);

        // Step 2: Fetch recipes associated with those ratings
        const { data: recipes, error: recipesError } = await supabase
          .from("recipes")
          .select("id, name, category, description, emoji, moods")
          .in("id", globalRecipeIds);

        if (recipesError) {
          setError("Error fetching recipes: " + recipesError.message);
          return;
        }

        // Step 3: Fetch the user's ratings for the selected moods
        const { data: userRatings, error: userError } = await supabase
          .from("recipe_ratings")
          .select("recipe_id, rating, mood")
          .eq("user_id", user.id)
          .in("mood", selectedMoods)
          .order("rating", { ascending: false });

        if (userError) {
          setError("Error fetching user ratings: " + userError.message);
          return;
        }

        // Step 4: Combine User Ratings and Global Ratings
        let finalMeals = [];

        if (userRatings.length > 0) {
          // If the user has ratings, prioritize those
          finalMeals = recipes.filter((meal) =>
            userRatings.some((rating) => rating.recipe_id === meal.id)
          );
        } else {
          // If the user doesn't have ratings, use the global ratings
          finalMeals = recipes.filter((meal) =>
            globalRatings.some((rating) => rating.recipe_id === meal.id)
          );
        }

        // Sort meals by rating (user ratings or global ratings)
        finalMeals = finalMeals.sort((a, b) => {
          const ratingA = userRatings.find((rating) => rating.recipe_id === a.id)?.rating || 0;
          const ratingB = userRatings.find((rating) => rating.recipe_id === b.id)?.rating || 0;
          return ratingB - ratingA;
        });

        setSuggestedMeals(finalMeals); // Set the combined meal suggestions

      } catch (err) {
        setError("Error fetching meal suggestions: " + err.message);
      }
    };

    fetchSuggestions();
  }, [user, selectedMoods]); // Re-run when user or selectedMoods change

  return (
    <div>
      <h2>Suggested Meals Based on Your Mood</h2>

      {/* Error handling */}
      {error && <p>{error}</p>}

      {/* Meal suggestion list */}
      <ul>
        {suggestedMeals.length === 0 ? (
          <p>No suggestions available based on your mood.</p>
        ) : (
          suggestedMeals.map((meal) => (
            <li key={meal.id}>
              <h3>{meal.name}</h3>
              <p>{meal.description}</p>
              <p>{meal.emoji}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
