




// import { useEffect, useState } from "react";
// import { supabase } from "../../lib/supabaseClient";
// import { getMealSuggestions } from "../../utils/mealSuggestionEngine";

// export default function MealSuggestions({ user, selectedMoods }) {
//   const [suggestedMeals, setSuggestedMeals] = useState([]);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!user || selectedMoods.length === 0) return;

//     const fetchSuggestions = async () => {
//       try {
//         // Step 1: Fetch global ratings for selected moods
//         const { data: globalRatings, error: globalError } = await supabase
//           .from("recipe_ratings")
//           .select("recipe_id, rating, mood")
//           .in("mood", selectedMoods);

//         if (globalError) {
//           setError("Error fetching global ratings: " + globalError.message);
//           return;
//         }

//         const globalRecipeIds = [...new Set(globalRatings.map(r => r.recipe_id))];

//         // Step 2: Fetch corresponding recipes
//         const { data: recipes, error: recipesError } = await supabase
//           .from("recipes")
//           .select("id, name, category, description, emoji, moods")
//           .in("id", globalRecipeIds);

//         if (recipesError) {
//           setError("Error fetching recipes: " + recipesError.message);
//           return;
//         }

//         // Step 3: Fetch user ratings for selected moods
//         const { data: userRatings, error: userError } = await supabase
//           .from("recipe_ratings")
//           .select("recipe_id, rating, mood")
//           .eq("user_id", user.id)
//           .in("mood", selectedMoods);

//         if (userError) {
//           setError("Error fetching user ratings: " + userError.message);
//           return;
//         }

//         // Step 4: Get last suggested meal ID from localStorage
//         const lastSuggestedId = localStorage.getItem("lastMealId");

//         // Step 5: Run meal suggestion algorithm
//         const finalMeals = getMealSuggestions({
//           userRatings,
//           globalRatings,
//           recipes,
//           lastSuggestedId: Number(lastSuggestedId)
//         });

//         // Step 6: Save the new suggestion ID
//         if (finalMeals.length > 0) {
//           localStorage.setItem("lastMealId", finalMeals[0].id);
//         }

//         setSuggestedMeals(finalMeals);
//       } catch (err) {
//         setError("Error fetching meal suggestions: " + err.message);
//       }
//     };

//     fetchSuggestions();
//   }, [user, selectedMoods]);

//   return (
//     <div>
//       <h2>Suggested Meals Based on Your Mood</h2>
//       {error && <p>{error}</p>}
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
import { getMealSuggestions } from "../../utils/mealSuggestionEngine"; // Make sure this path is correct

export default function MealSuggestions({ user, selectedMoods }) {
  const [suggestedMeals, setSuggestedMeals] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || selectedMoods.length === 0) return;

    const fetchSuggestions = async () => {
      try {
        const { data: globalRatings, error: globalError } = await supabase
          .from("recipe_ratings")
          .select("recipe_id, rating, mood")
          .in("mood", selectedMoods);

        if (globalError) {
          setError("Error fetching global ratings: " + globalError.message);
          return;
        }

        const globalRecipeIds = [...new Set(globalRatings.map(r => r.recipe_id))];

        const { data: recipes, error: recipesError } = await supabase
          .from("recipes")
          .select("id, name, category, description, emoji, moods")
          .in("id", globalRecipeIds);

        if (recipesError) {
          setError("Error fetching recipes: " + recipesError.message);
          return;
        }

        const { data: userRatings, error: userError } = await supabase
          .from("recipe_ratings")
          .select("recipe_id, rating, mood")
          .eq("user_id", user.id)
          .in("mood", selectedMoods);

        if (userError) {
          setError("Error fetching user ratings: " + userError.message);
          return;
        }

        // Get last suggested meal ID
        const lastSuggestedId = localStorage.getItem("lastMealId");

        // 🔁 Run the algorithm with full mood context
        const finalMeals = getMealSuggestions({
          userRatings,
          globalRatings,
          recipes,
          selectedMoods,
          lastSuggestedId: Number(lastSuggestedId)
        });

        // Save the new suggestion
        if (finalMeals.length > 0) {
          localStorage.setItem("lastMealId", finalMeals[0].id);
        }

        setSuggestedMeals(finalMeals);

      } catch (err) {
        setError("Error fetching meal suggestions: " + err.message);
      }
    };

    fetchSuggestions();
  }, [user, selectedMoods]);

  return (
    <div>
      <h2>Suggested Meals Based on Your Mood</h2>
      {error && <p>{error}</p>}
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
