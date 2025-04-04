
"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";
import { supabase } from "../lib/supabaseClient";
import AuthForm from "./components/AuthForm";
import EatOutSuggestions from "./components/EatOutSuggestion";
// import { motion } from "framer-motion";

const moodEmojis = {
  anxious: "😰",
  tired: "😴",
  happy: "😊",
  sad: "😢",
  angry: "😠",
  lonely: "😔",
  jealous: "😒",
  excited: "🤩",
  grateful: "🙏",
  overwhelmed: "😵‍💫",
  breakup: "💔",
  bored: "😐",
  celebrating: "🥳",
  working: "💼",
  studying: "📚",
  raining: "🌧️",
  sunny: "☀️",
  hungover: "🤕",
  traveling: "✈️",
  "date-night": "💘",
  lazy: "🛋️",
  energetic: "⚡",
  restless: "🌀",
  focused: "🎯",
  "burnt-out": "🔥",
  motivated: "🏃",
  wired: "😳",
  calm: "🧘",
  chill: "🧊",
  exhausted: "🥱",
};


export default function Home() {
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [recipes, setRecipes] = useState({});
  const [recipe, setRecipe] = useState(null);
  const [cookingMode, setCookingMode] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [showSuggestionMessage, setShowSuggestionMessage] = useState(false);
  const [showRecipeCard, setShowRecipeCard] = useState(false);
  const [user, setUser] = useState(null);
  const [eatOutMode, setEatOutMode] = useState(false);
  const [readyToShowMoods, setReadyToShowMoods] = useState(false);


  const clickSound = new Howl({ src: ["/sounds/click.mp3"], volume: 0.4 });
  const chimeSound = new Howl({ src: ["/sounds/chime.mp3"], volume: 0.4 });
  const bloopSound = new Howl({ src: ["/sounds/bloop.mp3"], volume: 0.4 });

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };

    // const fetchRecipes = async () => {
    //   const { data, error } = await supabase.from("recipes").select("*");
    //   if (error) {
    //     console.error("Error fetching recipes:", error.message);
    //   } else {
    //     const formatted = {};
    //       data.forEach((recipe) => {
    //         recipe.moods.forEach((mood) => {
    //           if (!formatted[mood]) {
    //             formatted[mood] = [];
    //           }
    //           formatted[mood].push(recipe);
    //         });
    //       });

    //     setRecipes(formatted);
    //   }
    // };
    const fetchRecipes = async () => {
      const { data, error } = await supabase.from("recipes").select("*");
      if (error) {
        console.error("Error fetching recipes:", error.message);
      } else {
        const formatted = {};
        data.forEach((recipe) => {
          recipe.moods.forEach((mood) => {
            if (!formatted[mood]) {
              formatted[mood] = [];
            }
            formatted[mood].push(recipe);
          });
        });
        setRecipes(formatted);
        console.log("Formatted recipes by mood:", formatted); // debug
      }
    };
    

    getUser();
    setTimeout(() => setReadyToShowMoods(true), 300); // 300ms animation prep
    fetchRecipes();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") setUser(session.user);
      if (event === "SIGNED_OUT") setUser(null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleMultiMoodSubmit = () => {
    if (selectedMoods.length === 0) return;
    // const chosen = selectedMoods[Math.floor(Math.random() * selectedMoods.length)];
    // setRecipe(recipes[chosen]);
    const mood = selectedMoods[Math.floor(Math.random() * selectedMoods.length)];
    const moodRecipes = recipes[mood];
    const randomRecipe = moodRecipes[Math.floor(Math.random() * moodRecipes.length)];
    setRecipe(randomRecipe);

    setCookingMode(false);
    setShowSuggestionMessage(true);
    setShowRecipeCard(false);
    setTimeout(() => {
      setShowSuggestionMessage(false);
      setShowRecipeCard(true);
    }, 2000);
  };

  const handleReshuffle = () => {
    setRecipe(null);
    setShowRecipeCard(false);
    setShowSuggestionMessage(false);
    setCookingMode(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-100 to-orange-100">
        <AuthForm onAuthSuccess={(data) => setUser(data.user)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-4 py-12 text-center font-sans">
      <div className="absolute top-4 right-4">
        <button onClick={() => window.location.href = '/profile'}>
          <img
            src={user?.user_metadata?.avatar_url || "/rascal-fallback.png"}
            alt="Profile"
            className="w-12 h-12 rounded-full border-2 border-pink-400 shadow-sm object-cover"
          />
        </button>
      </div>

      <motion.h1
        className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🍴 Fork My Feels
      </motion.h1>

      <motion.p
        className="text-lg sm:text-xl text-gray-700 mb-8 max-w-xl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Tell us how you feel. We'll feed your vibe.
      </motion.p>

      {readyToShowMoods && !cookingMode && !showSuggestionMessage && !showRecipeCard && (
        <>
          <motion.button
            onClick={() => {
              bloopSound.play();
              setEatOutMode(!eatOutMode);
            }}
            whileTap={{ scale: 0.97 }}
            className="mb-4 bg-purple-200 hover:bg-purple-300 text-purple-800 font-semibold py-2 px-4 rounded-xl shadow-sm transition"
          >
            {eatOutMode ? "Back to Mood Recipes" : "I'm Eating Out 🍽️"}
          </motion.button>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: { staggerChildren: 0.05, delayChildren: 1 },
              },
            }}
          >
            {Object.keys(recipes).length === 0 ? (
              <p className="text-gray-500">Loading recipes...</p>
            ) : (
              Object.keys(recipes)
                .filter((moodKey) => moodKey !== "default")
                .map((moodKey) => (
                  <motion.button
                    key={moodKey}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    onClick={() => {
                      clickSound.play();
                      setSelectedMoods((prev) =>
                        prev.includes(moodKey)
                          ? prev.filter((m) => m !== moodKey)
                          : [...prev, moodKey]
                      );
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={`shadow-md px-4 py-2 rounded-xl border transition text-sm sm:text-base ${
                      selectedMoods.includes(moodKey)
                        ? "bg-pink-200 border-pink-400"
                        : "bg-white border-gray-300 hover:bg-pink-100"
                    }`}
                  >
                    {moodEmojis[moodKey] || "🍽️"}{" "}
                    {moodKey.charAt(0).toUpperCase() + moodKey.slice(1)}
                  </motion.button>
                ))
            )}
          </motion.div>


          <motion.button
            onClick={() => {
              chimeSound.play();
              handleMultiMoodSubmit();
            }}
            className="mt-6 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition"
            whileTap={{ scale: 0.97 }}
          >
            Feed Me
          </motion.button>
        </>
      )}

      <AnimatePresence>
        {showSuggestionMessage && (
          <motion.div
            key="suggestion-msg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
            className="text-xl font-medium text-pink-600 mt-10"
          >
            Based on your vibe... 💫
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRecipeCard && recipe && !cookingMode && (
          <motion.div
            key="recipe-card"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.6 }}
            className="mt-8 w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              {recipe.emoji} {recipe.name}
            </h2>
            <p className="text-gray-700 mb-4">{recipe.description}</p>
            {recipe.ingredients && (
              <div className="text-left text-gray-800 mb-4">
                <h3 className="font-semibold mb-1">🧂 Ingredients</h3>
                <ul className="list-disc list-inside">
                  {recipe.ingredients.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}


            {recipe.steps && (
              <motion.button
                onClick={() => {
                  setCookingMode(true);
                  setActiveStepIndex(0);
                }}
                whileTap={{ scale: 0.96 }}
                className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl shadow-sm transition"
              >
                Let’s Make It →
              </motion.button>
            )}

            <motion.button
              onClick={() => {
                bloopSound.play();
                handleReshuffle();
              }}
              whileTap={{ scale: 0.96 }}
              className="mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl transition"
            >
              I’m not feeling it
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {eatOutMode && <EatOutSuggestions selectedMoods={selectedMoods} />}

      {cookingMode && recipe?.steps && (
        <div className="mt-6 bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {recipe.emoji} {recipe.name}
          </h2>
          <h3 className="text-xl font-semibold mb-2">
            Step {activeStepIndex + 1} of {recipe.steps.length}
          </h3>
          <p className="text-gray-800 mb-4">{recipe.steps[activeStepIndex]}</p>
          <div className="flex justify-between items-center">
            <button
              onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
              disabled={activeStepIndex === 0}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              ← Back
            </button>
            {activeStepIndex < recipe.steps.length - 1 ? (
              <button
                onClick={() =>
                  setActiveStepIndex((i) => Math.min(recipe.steps.length - 1, i + 1))
                }
                className="text-sm text-pink-500 hover:text-pink-700"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => {
                  setCookingMode(false);
                  setActiveStepIndex(0);
                }}
                className="text-sm text-green-600 hover:text-green-800"
              >
                Done ✓
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}





// "use client";
// import { useEffect, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Howl } from "howler";
// // import recipes from "../data/recipes";
// import { supabase } from "../lib/supabaseClient";
// import AuthForm from "./components/AuthForm";
// import EatOutSuggestions from "./components/EatOutSuggestion";

// // import RecipeSubmissionForm from "./components/RecipeSubmissionForm"; // Optional

// export default function Home() {
//   const [selectedMoods, setSelectedMoods] = useState([]);
//   const [recipe, setRecipe] = useState(null);
//   const [cookingMode, setCookingMode] = useState(false);
//   const [activeStepIndex, setActiveStepIndex] = useState(0);
//   const [showSuggestionMessage, setShowSuggestionMessage] = useState(false);
//   const [showRecipeCard, setShowRecipeCard] = useState(false);
//   const [user, setUser] = useState(null);
//   const [eatOutMode, setEatOutMode] = useState(false);
//   const [recipes, setRecipes] = useState({});



//   // Sounds
//   const clickSound = new Howl({ src: ["/sounds/click.mp3"], volume: 0.4 });
//   const chimeSound = new Howl({ src: ["/sounds/chime.mp3"], volume: 0.4 });
//   const bloopSound = new Howl({ src: ["/sounds/bloop.mp3"], volume: 0.4 });

//   // Auth listener
//   useEffect(() => {
//     const getUser = async () => {
//       const { data, error } = await supabase.auth.getUser();
//       if (data?.user) setUser(data.user);
//     };
//     getUser();

//     const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
//       if (event === "SIGNED_IN") setUser(session.user);
//       if (event === "SIGNED_OUT") setUser(null);
//     });

//     return () => {
//       listener?.subscription.unsubscribe();
//     };
//   }, []);

//   const handleMultiMoodSubmit = () => {
//     if (selectedMoods.length === 0) return;

//     const chosen = selectedMoods[Math.floor(Math.random() * selectedMoods.length)];
//     setRecipe(recipes[chosen]);
//     setCookingMode(false);
//     setShowSuggestionMessage(true);
//     setShowRecipeCard(false);

//     setTimeout(() => {
//       setShowSuggestionMessage(false);
//       setShowRecipeCard(true);
//     }, 2000);
//   };

//   const handleReshuffle = () => {
//     setRecipe(null);
//     setShowRecipeCard(false);
//     setShowSuggestionMessage(false);
//     setCookingMode(false);
//   };

//   if (!user) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-100 to-orange-100">
//         <AuthForm onAuthSuccess={(data) => setUser(data.user)} />
//       </div>
//     );
//   }
  

//   return (
    
    
//     <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-4 py-12 text-center font-sans">
//       <div className="absolute top-4 right-4">
//       <button onClick={() => window.location.href = '/profile'}>
//       <img
//       src={user?.user_metadata?.avatar_url || "/rascal-fallback.png"}
//       alt="Profile"
//       className="w-12 h-12 rounded-full border-2 border-pink-400 shadow-sm object-cover"
//       />
//         </button>
//     </div>
//       <motion.h1
//         className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4"
//         initial={{ opacity: 0, y: -40 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//       >
//         🍴 Fork My Feels
//       </motion.h1>

//       <motion.p
//         className="text-lg sm:text-xl text-gray-700 mb-8 max-w-xl"
//         initial={{ opacity: 0, y: -10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.4, duration: 0.6 }}
//       >
//         Tell us how you feel. We'll feed your vibe.
//       </motion.p>

//       {!cookingMode && !showSuggestionMessage && !showRecipeCard && (
//           <>
//             <motion.button
//               onClick={() => {
//                 bloopSound.play();
//                 setEatOutMode(!eatOutMode); // You'll need to define eatOutMode and setEatOutMode
//               }}
//               whileTap={{ scale: 0.97 }}
//               className="mb-4 bg-purple-200 hover:bg-purple-300 text-purple-800 font-semibold py-2 px-4 rounded-xl shadow-sm transition"

//             >
//               {eatOutMode ? "Back to Mood Recipes" : "I'm Eating Out 🍽️"}
//             </motion.button>

//             <motion.div
//               className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6"
//               initial="hidden"
//               animate="visible"
//               variants={{
//                 visible: {
//                   transition: { staggerChildren: 0.05, delayChildren: 1 },
//                 },
//               }}
//             >
//               {Object.keys(recipes)
//                 .filter((mood) => mood !== "default")
//                 .map((moodKey) => (
//                   <motion.button
//                     key={moodKey}
//                     variants={{
//                       hidden: { opacity: 0, y: 10 },
//                       visible: { opacity: 1, y: 0 },
//                     }}
//                     onClick={() => {
//                       clickSound.play();
//                       setSelectedMoods((prev) =>
//                         prev.includes(moodKey)
//                           ? prev.filter((m) => m !== moodKey)
//                           : [...prev, moodKey]
//                       );
//                     }}
//                     whileTap={{ scale: 0.97 }}
//                     className={`shadow-md px-4 py-2 rounded-xl border transition text-sm sm:text-base ${
//                       selectedMoods.includes(moodKey)
//                         ? "bg-pink-200 border-pink-400"
//                         : "bg-white border-gray-300 hover:bg-pink-100"
//                     }`}
//                   >
//                     {recipes[moodKey].emoji}{" "}
//                     {moodKey.charAt(0).toUpperCase() + moodKey.slice(1)}
//                   </motion.button>
//                 ))}
//             </motion.div>

//             <motion.button
//               onClick={() => {
//                 chimeSound.play();
//                 handleMultiMoodSubmit();
//               }}
//               className="mt-6 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition"
//               whileTap={{ scale: 0.97 }}
//             >
//               Feed Me
//             </motion.button>
//           </>
//         )}


//       <AnimatePresence>
//         {showSuggestionMessage && (
//           <motion.div
//             key="suggestion-msg"
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             exit={{ opacity: 0, scale: 0.9 }}
//             transition={{ duration: 0.6 }}
//             className="text-xl font-medium text-pink-600 mt-10"
//           >
//             Based on your vibe... 💫
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <AnimatePresence>
//         {showRecipeCard && recipe && !cookingMode && (
//           <motion.div
//             key="recipe-card"
//             initial={{ opacity: 0, y: 40 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: 40 }}
//             transition={{ duration: 0.6 }}
//             className="mt-8 w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
//           >
//             <h2 className="text-2xl font-semibold text-gray-900 mb-2">
//               {recipe.emoji} {recipe.name}
//             </h2>
//             <p className="text-gray-700 mb-4">{recipe.description}</p>

//             {recipe.steps && (
//               <motion.button
//                 onClick={() => {
//                   setCookingMode(true);
//                   setActiveStepIndex(0);
//                 }}
//                 whileTap={{ scale: 0.96 }}
//                 className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl shadow-sm transition"
//               >
//                 Let’s Make It →
//               </motion.button>
//             )}

//             <motion.button
//               onClick={() => {
//                 bloopSound.play();
//                 handleReshuffle();
//               }}
//               whileTap={{ scale: 0.96 }}
//               className="mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl transition"
//             >
//               I’m not feeling it
//             </motion.button>
//           </motion.div>
//         )}
//       </AnimatePresence>
//       {eatOutMode && (
//   <EatOutSuggestions selectedMoods={selectedMoods} />
// )}

//       {cookingMode && recipe?.steps && (
//         <div className="mt-6 bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
//           <h2 className="text-2xl font-bold text-gray-900 mb-4">
//             {recipe.emoji} {recipe.name}
//           </h2>
//           <h3 className="text-xl font-semibold mb-2">
//             Step {activeStepIndex + 1} of {recipe.steps.length}
//           </h3>
//           <p className="text-gray-800 mb-4">{recipe.steps[activeStepIndex]}</p>
//           <div className="flex justify-between items-center">
//             <button
//               onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
//               disabled={activeStepIndex === 0}
//               className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
//             >
//               ← Back
//             </button>
//             {activeStepIndex < recipe.steps.length - 1 ? (
//               <button
//                 onClick={() =>
//                   setActiveStepIndex((i) => Math.min(recipe.steps.length - 1, i + 1))
//                 }
//                 className="text-sm text-pink-500 hover:text-pink-700"
//               >
//                 Next →
//               </button>
//             ) : (
//               <button
//                 onClick={() => {
//                   setCookingMode(false);
//                   setActiveStepIndex(0);
//                 }}
//                 className="text-sm text-green-600 hover:text-green-800"
//               >
//                 Done ✓
//               </button>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
