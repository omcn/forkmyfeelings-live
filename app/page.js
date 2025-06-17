




"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";

import AuthForm from "./components/AuthForm";
import EatOutSuggestions from "./components/EatOutSuggestion";
import ingredientPrices from "../data/mockPrice";
import RecipePostCapture from "./components/RecipePostCapture";
import { supabase } from "../lib/supabaseClient";
import { getMealSuggestions } from "../utils/mealSuggestionEngine";


import { mergeImages } from "../lib/mergeImages";
import { b } from "framer-motion/client";

// import { motion } from "framer-motion";

const moodEmojis = {
  // anxious: "😰",
  // tired: "😴",
  // happy: "😊",
  // sad: "😢",
  // angry: "😠",
  // lonely: "😔",
  // jealous: "😒",
  // excited: "🤩",
  // grateful: "🙏",
  // overwhelmed: "😵‍💫",
  // breakup: "💔",
  // bored: "😐",
  // celebrating: "🥳",
  // working: "💼",
  // studying: "📚",
  // raining: "🌧️",
  // sunny: "☀️",
  // hungover: "🤕",
  // traveling: "✈️",
  // "date-night": "💘",
  // lazy: "🛋️",
  // energetic: "⚡",
  // restless: "🌀",
  // focused: "🎯",
  // "burnt-out": "🔥",
  // motivated: "🏃",
  // wired: "😳",
  // calm: "🧘",
  // chill: "🧊",
  // exhausted: "🥱",

  tired: "😴",
  happy: "😊",
  sad: "😢",
  rushed: "⏰",
  "date-night": "💘",
  chill: "🧊",
  recovering: "🛌",
  bored: "😐",
  nostalgic: "🕰️",
  overwhelmed: "😵‍💫",
};



function MoodTooltip({ label, children }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(true)}
      onTouchEnd={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full mb-1 px-2 py-1 text-xs rounded bg-black text-white shadow z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
}

// const rascalVideos = {
//   sad: "/videos/rascal-sad.mp4",
//   tired: "/videos/rascal-tired.mp4",
//   default: "/rascal-fallback.png", // fallback image
// };
// const currentMood = selectedMoods[0] || "default";


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
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [moodRating, setMoodRating] = useState(0);
  const [showPostCapture, setShowPostCapture]= useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [posts, setPosts] = useState([]);
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [debugMessage, setDebugMessage] = useState("");







  const clickSound = new Howl({ src: ["/sounds/click.mp3"], volume: 0.4 });
  const chimeSound = new Howl({ src: ["/sounds/chime.mp3"], volume: 0.4 });
  const bloopSound = new Howl({ src: ["/sounds/bloop.mp3"], volume: 0.4 });

  const submitRecipeRating = async (ratingValue) => {
    if (!user || !recipe) return;
  
    const { error } = await supabase.from("recipe_ratings").insert([
      {
        user_id: user.id,
        recipe_id: recipe.id,
        rating: ratingValue,
        mood: selectedMoods[0] || null,
      },
    ]);
  
    if (error) {
      console.error("❌ Failed to save rating:", error.message);
    } else {
      console.log("✅ Rating saved:", ratingValue);
    }
  };

  // {showPostCapture && (
  //   <RecipePostCapture
  //     user={user}
  //     recipe={recipe}
  //     moods={selectedMoods}
  //     rating={rating}
  //     onComplete={() => {
  //       setShowPostCapture(false);
  //       handleReshuffle();
  //     }}
  //   />
  // )}
  
  
  

  // useEffect(() => {
  //   const getUser = async () => {
  //     // const { data, error } = await supabase.auth.getUser();
  //     // if (data?.user) setUser(data.user);
  //     const { data: { session } } = await supabase.auth.getSession();
  //     if (session?.user) setUser(session.user);

  //   };

  //   if (recipe) {
  //     setMoodRating(null); // reset stars on new recipe
  //   }

  //   const loadPosts = async () => {
  //     const today = new Date().toISOString().slice(0, 10);
  //     const { data, error } = await supabase
  //       .from("recipe_posts")
  //       .select("*")
  //       .gte("created_at", today)
  //       .order("created_at", { ascending: false });
  
  //     if (!error) setPosts(data);
  //   };
  //   loadPosts();

    
  //   const fetchRecipes = async () => {
  //     const { data, error } = await supabase.from("recipes").select("*");
  //     if (error) {
  //       console.error("Error fetching recipes:", error.message);
  //     } else {
  //       const formatted = {};
  //       data.forEach((recipe) => {
  //         const moods = typeof recipe.moods === "string"
  //           ? JSON.parse(recipe.moods)
  //           : recipe.moods;

  //         moods.forEach((mood) => {
  //           if (!formatted[mood]) {
  //             formatted[mood] = [];
  //           }
  //           formatted[mood].push(recipe);
  //         });
  //       });

  //       setRecipes(formatted);
  //       console.log("Formatted recipes by mood:", formatted); // debug
  //     }
  //   };
    

  //   getUser();
  //   setTimeout(() => setReadyToShowMoods(true), 300); // 300ms animation prep
  //   fetchRecipes();

  //   const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
  //     if (event === "SIGNED_IN") setUser(session.user);
  //     if (event === "SIGNED_OUT") setUser(null);
  //   });

    
    

  //   return () => {
  //     listener?.subscription.unsubscribe();
  //   };
  // }, []);

  useEffect(() => {
    let listener;
  
    const initApp = async () => {
      // 1. Get session safely
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      setUser(currentUser);
  
      // 2. Load today's posts
      const today = new Date().toISOString().slice(0, 10);
      const { data: postData, error: postError } = await supabase
        .from("recipe_posts")
        .select("*")
        .gte("created_at", today)
        .order("created_at", { ascending: false });
  
      if (!postError) {
        setPosts(postData);
      }
  
      // 3. Load recipes and group by moods
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("*");
  
      if (!recipeError) {
        const formatted = {};
        recipeData.forEach((recipe) => {
          const moods = typeof recipe.moods === "string"
            ? JSON.parse(recipe.moods)
            : recipe.moods;
  
          moods.forEach((mood) => {
            if (!formatted[mood]) {
              formatted[mood] = [];
            }
            formatted[mood].push(recipe);
          });
        });
        setRecipes(formatted);
      }
  
      // 4. Animate mood buttons after a short delay
      setTimeout(() => setReadyToShowMoods(true), 300);
    };
  
    initApp();
  
    // 5. Auth state change listener
    listener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") setUser(session.user);
      if (event === "SIGNED_OUT") setUser(null);
    });
  
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);
  

  
  // const handleMultiMoodSubmit = () => {
  //   if (selectedMoods.length === 0) return;
  
  //   // Combine recipes across all selected moods
  //   const allMatchingRecipes = selectedMoods.flatMap((mood) => recipes[mood] || []);
  
  //   // Remove duplicates by recipe ID (in case a recipe matches multiple moods)
  //   const uniqueRecipes = Array.from(new Map(
  //     allMatchingRecipes.map((recipe) => [recipe.id, recipe])
  //   ).values());
  
  //   // Pick a truly random one from the full pool
  //   if (uniqueRecipes.length === 0) return;
  //   const randomRecipe = uniqueRecipes[Math.floor(Math.random() * uniqueRecipes.length)];
  
  //   setRecipe(randomRecipe);
  //   setMoodRating(0);
  //   setCookingMode(false);
  //   setShowSuggestionMessage(true);
  //   setShowRecipeCard(false);
  
  //   setTimeout(() => {
  //     setShowSuggestionMessage(false);
  //     setShowRecipeCard(true);
  //   }, 2000);
  // };
  

  const handleMultiMoodSubmit = async () => {
    if (selectedMoods.length === 0) {
      setDebugMessage("⚠️ No moods selected.");
      return;
    }
  
    setDebugMessage("⏳ Fetching ratings...");
  
    const lastSuggestedId = localStorage.getItem("lastMealId");
  
    const { data: userRatings, error: userError } = await supabase
      .from("recipe_ratings")
      .select("recipe_id, rating, mood")
      .eq("user_id", user.id)
      .in("mood", selectedMoods);
  
    const { data: globalRatings, error: globalError } = await supabase
      .from("recipe_ratings")
      .select("recipe_id, rating, mood")
      .in("mood", selectedMoods);
  
    if (userError || globalError) {
      setDebugMessage("❌ Error fetching ratings.");
      return;
    }
  
    const allMatchingRecipes = selectedMoods.flatMap((mood) => recipes[mood] || []);
    const uniqueRecipes = Array.from(new Map(
      allMatchingRecipes.map((recipe) => [recipe.id, recipe])
    ).values());
  
    if (uniqueRecipes.length === 0) {
      setDebugMessage("❌ No matching recipes found.");
      return;
    }
  
    const [suggestion] = getMealSuggestions({
      userRatings,
      globalRatings,
      recipes: uniqueRecipes,
      selectedMoods,
      lastSuggestedId: Number(lastSuggestedId)
    });
  
    if (!suggestion) {
      setDebugMessage("❌ No suggestion returned from engine.");
      return;
    }
  
    localStorage.setItem("lastMealId", suggestion.id);
    setRecipe(suggestion);
    setMoodRating(0);
    setCookingMode(false);
    setShowSuggestionMessage(true);
    setShowRecipeCard(false);
    setDebugMessage(`✅ Suggested: ${suggestion.name}`);
  
    setTimeout(() => {
      setShowSuggestionMessage(false);
      setShowRecipeCard(true);
      setDebugMessage(""); // Clear message after showing
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
              const turningOn = !eatOutMode;
              setEatOutMode(turningOn);

              if (turningOn && "geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    console.log("📍 Location:", position.coords.latitude, position.coords.longitude);
                    // You can optionally store the coords in state here if needed
                  },
                  (error) => {
                    console.warn("⚠️ Location error:", error.message);
                  }
                );
              }
            }}
            whileTap={{ scale: 0.97 }}
            className="mb-8 bg-purple-200 hover:bg-purple-300 text-purple-800 font-semibold py-4 px-8 rounded-full shadow-sm transition"
          >
            {eatOutMode ? "Back to Mood Recipes" : "I'm Eating Out 🍽️"}
          </motion.button>


          <div className="relative w-[500px] h-[500px] mx-auto">
            {/* Mood Buttons in orbit */}
            <motion.div
              className="absolute"
              style={{
                left: isMobile ? "28.5%" : "38%",
                top: isMobile ? "40%" : "46%",
                transform: "translate(-50%, -50%)",
              }}
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: { staggerChildren: 0.04, delayChildren: 0.5 },
                },
              }}
            >
              {Object.keys(recipes)
                  .filter((moodKey) => moodKey !== "default")
                  .map((moodKey, i, arr) => {
                    const total = arr.length;
                    const angle = (360 / total) * i;
                    const radius = isMobile ? 160 : 220;
                    const x = radius * Math.cos((angle * Math.PI) / 180);
                    const y = radius * Math.sin((angle * Math.PI) / 180);

                    return (
                      <motion.button
                        key={moodKey}
                        style={{
                          position: "absolute",
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                          transform: "translate(-50%, -50%)",
                          width: isMobile ? "90px" : "130px",
                          height: isMobile ? "60px" : "70px",
                          borderRadius: "999px",
                        }}
                        variants={{
                          hidden: { opacity: 0, scale: 0.8 },
                          visible: { opacity: 1, scale: 1 },
                        }}
                        onClick={() => {
                          clickSound.play();
                          setSelectedMoods((prev) =>
                            prev.includes(moodKey)
                              ? prev.filter((m) => m !== moodKey)
                              : [...prev, moodKey]
                          );
                        }}
                        whileTap={{ scale: 0.95 }}
                        className={`shadow-md px-4 py-2 text-base rounded-full border transition ${
                          selectedMoods.includes(moodKey)
                            ? "bg-pink-200 border-pink-400"
                            : "bg-white border-gray-300 hover:bg-pink-100"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span style={{ fontSize: "1.5rem" }}>
                            {moodEmojis[moodKey] || "🍽️"}
                          </span>
                          <span className="text-sm font-medium mt-1 capitalize">
                            {moodKey.replace("-", " ")}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}

                                  
              
            </motion.div>

            {/* Rascal reacts to mood */}
            {/* {(() => {
              const rascalVideos = {
                sad: "/videos/rascal-sad.mp4",
                tired: "/videos/rascal-tired.mp4",
                default: "/videos/rascal-idle.mp4",
              };

              const currentMood = selectedMoods[0] || "default";
              // const isVideo = rascalVideos[currentMood]?.endsWith(".mp4");
              // const currentMood = selectedMoods[0];
              const videoSrc = rascalVideos[currentMood];
              const isVideo = Boolean(videoSrc);


              const wrapperStyle = {
                width: isMobile ? "200px" : "250px",
                height: isMobile ? "200px" : "250px",
                left: isMobile ? "38%" : "50%",
                top: isMobile ? "45%" : "50%",
                transform: "translate(-50%, -50%)",
              };

              return (
                <div
                  className="absolute z-20 rounded-full border-2 border-pink-300 shadow-lg bg-white overflow-hidden"
                  style={wrapperStyle}
                >
                  {isVideo ? (
                    <video
                      key={currentMood}
                      src={rascalVideos[currentMood]}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      key="fallback"
                      src={rascalVideos.default}
                      alt="Rascal Mascot"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              );
            })()}
 */}
              {(() => {
                const rascalVideos = {
                  sad: "/videos/rascal-sad.mp4",
                  tired: "/videos/rascal-tired.mp4",
                  // add more as needed
                };

                const currentMood = selectedMoods[0];
                const videoSrc = rascalVideos[currentMood] || "/videos/rascal-idle.mp4";

                const wrapperStyle = {
                  width: isMobile ? "96px" : "250px",
                  height: isMobile ? "96px" : "250px",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                };

                return (
                  <div
                    className="absolute z-20 rounded-full border-2 border-pink-300 shadow-lg bg-white overflow-hidden"
                    style={wrapperStyle}
                  >
                    <AnimatePresence mode="wait">
                      <motion.video
                        key={videoSrc}
                        src={videoSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>
                  </div>
                );
              })()}


          </div>


          <motion.button
            // onClick={() => {
            //   chimeSound.play();
            //   handleMultiMoodSubmit();
            // }}
            onClick={async () => {
              chimeSound.play();
              await handleMultiMoodSubmit();
            }}
            className="mt-12 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-6 px-12 rounded-full shadow-md transition"
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

        {showPostCapture && user &&(
          <motion.div
            key="post-capture"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
          >
            <RecipePostCapture
              user={user}
              recipe={recipe}
              moods={selectedMoods}
              rating={moodRating}
              onComplete={() => {
                setShowPostCapture(false);
                handleReshuffle();
              }}
            />
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
                {(
                  Array.isArray(recipe.ingredients)
                    ? recipe.ingredients
                    : JSON.parse(recipe.ingredients || "[]")
                ).map((item, index) => (
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
                setMoodRating(0); // or the selected star value
                submitRecipeRating(0);

              }}
              whileTap={{ scale: 0.96 }}
              className="mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl transition"
            >
              I’m not feeling it
            </motion.button>

            <motion.button
              onClick={() => setShowShoppingList(true)}
              whileTap={{ scale: 0.96 }}
              className="mt-3 bg-green-100 hover:bg-green-200 text-green-800 font-medium py-2 px-4 rounded-xl transition"
            >
              🛒 Let’s Go Shopping
            </motion.button>

          </motion.div>
        )}
      </AnimatePresence>
      {showShoppingList && recipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative">
            <button
              onClick={() => setShowShoppingList(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-4 text-center">🛍️ Shopping List</h2>
            <ul className="list-disc list-inside text-left space-y-1 text-gray-800">
            {(
              Array.isArray(recipe.ingredients)
                ? recipe.ingredients
                : JSON.parse(recipe.ingredients || "[]")
            ).map((item, index) => {
              const normalized = item
                .toLowerCase()
                .replace(/^(to serve|drizzle|handful|slice[ds]?|chopped|diced|sliced|crushed|peeled|minced|grated|halved|zest(ed)?|juice(d)?|large|small|medium|extra large|cloves?)\b/g, "")
                .replace(/^[\d\/\s,.]+(g|kg|ml|l|oz|tblsp|tbsp|tsp|cup|tablespoons?|teaspoons?)?\s*/g, "")
                .replace(/[^a-z\s]/g, "")
                .replace(/\s+/g, " ")
                .trim();

              const price = ingredientPrices[normalized];
              if (!price) {
                console.log("🧐 Missing price for:", normalized);
              }

              return (
                <li key={index}>
                  {item} –{" "}
                  {price !== undefined ? `£${price.toFixed(2)}` : "£N/A"}
                </li>
              );
            })}


            </ul>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  const list = (
                    Array.isArray(recipe.ingredients)
                      ? recipe.ingredients
                      : JSON.parse(recipe.ingredients || "[]")
                  ).join("\n");

                  navigator.clipboard.writeText(list).then(() => {
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  });
                }}
                className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition"
              >
                📋 Copy to Clipboard
              </button>

              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                  (
                    Array.isArray(recipe.ingredients)
                      ? recipe.ingredients
                      : JSON.parse(recipe.ingredients || "[]")
                  ).join("\n")
                )}`}
                download={`shopping-list-${recipe.name.replace(/\s+/g, "-").toLowerCase()}.txt`}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-xl transition text-center"
              >
                💾 Save to Notes
              </a>
              {copySuccess && (
                <p className="text-green-600 mt-2 text-sm text-center">
                  ✅ Copied to clipboard!
                </p>
              )}

            </div>

          </div>
        </div>
      )}


      {eatOutMode && <EatOutSuggestions selectedMoods={selectedMoods} />}

      

      {cookingMode && (() => {
      let stepsArray = [];
      try {
        stepsArray = Array.isArray(recipe.steps)
          ? recipe.steps
          : JSON.parse(recipe.steps || "[]");
      } catch (err) {
        console.error("❌ Failed to parse steps", err);
      }
      

      return (
        <div className="mt-6 bg-white p-6 rounded-2xl shadow-xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {recipe.emoji} {recipe.name}
          </h2>
          <h3 className="text-xl font-semibold mb-2">
            Step {activeStepIndex + 1} of {stepsArray.length}
          </h3>
          <p className="text-gray-800 mb-4">{stepsArray[activeStepIndex]}</p>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
              disabled={activeStepIndex === 0}
              className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              ← Back
            </button>
            {activeStepIndex < stepsArray.length - 1 ? (
              <button
                onClick={() =>
                  setActiveStepIndex((i) => Math.min(stepsArray.length - 1, i + 1))
                }
                className="text-sm text-pink-500 hover:text-pink-700"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => {
                  // setShowRatingModal(true);
                  // setCookingMode(false);
                  // setActiveStepIndex(0);
                  setShowRatingModal(true); // Show rating modal

                }}
                className="text-sm text-green-600 hover:text-green-800"
              >
                Done ✓
              </button>

            )}
            {showRatingModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative text-center">
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl"
                  >
                    ✕
                  </button>
                  <h2 className="text-xl font-semibold mb-2">⭐ Rate This Recipe</h2>
                  <p className="text-gray-600 mb-4">How well did it match your mood?</p>

                  <div className="flex justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setMoodRating(star)}
                        className={`text-2xl ${
                          star <= moodRating ? "text-yellow-400" : "text-gray-300"
                        } hover:text-yellow-500 transition`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => {
                        // setMoodRating(0); // or the selected star value
                        setShowRatingModal(false);
                        setCookingMode(false);
                        setActiveStepIndex(0);
                        // setMoodRating(0); // "Not feeling it" = 0
                        setShowRatingModal(false);
                        setRecipe(null);           // 👈 reset the selected recipe
                        setActiveStepIndex(0);     // 👈 reset step
                        console.log("User didn't vibe with this one.");
                        // Later: Save to Supabase
                      }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl transition"
                    >
                      😐 Not Feeling It
                    </button>
                    <button
                      onClick={() => {
                        setMoodRating(moodRating); // or the selected star value
                        setCookingMode(false);
                        setActiveStepIndex(0);
                        setShowRatingModal(false);
                        // setRecipe(null);           // 👈 reset the selected recipe
                        setActiveStepIndex(0); 
                        submitRecipeRating(moodRating);
                        setShowPostCapture(true);
                        // handleReshuffle();
                            // 👈 reset step
                        console.log("Saved mood rating:", moodRating);
                        // Later: Save to Supabase
                      }}
                      className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition"
                    >
                      ✅ Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
            

            {/* </div> // 👈 LEAVE THIS — it closes your main return */}

           


            

          </div>
        </div>
      );
    })()}
    {!cookingMode && !showRecipeCard && !showRatingModal && (
  <>
    <button
      onClick={() => setShowFeed(true)}
      className="fixed bottom-6 right-6 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-full shadow-xl z-50"
    >
      📸 Today’s Feed
    </button>

    {showFeed && (
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 120 }}
        className="fixed inset-0 bg-white z-50 overflow-y-auto px-4 pt-6 pb-16"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">📸 Today’s Forks</h2>
          <button
            onClick={() => setShowFeed(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ✕ Close
          </button>
        </div>

        {posts.length === 0 ? (
          <p className="text-gray-500 text-center mt-10">
            No posts yet today!
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-gray-50 p-4 rounded-xl shadow-md"
              >
                <img
                  src={post.photo_url}
                  alt="Post"
                  className="rounded-md mb-2 w-full object-cover"
                />
                <div className="text-sm text-gray-700">
                  <p>🧠 Mood: {post.moods}</p>
                  <p>⭐ {post.rating || "Unrated"}</p>
                  <p className="text-xs text-gray-400">
                    🕒 {new Date(post.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    )}
  </>
)}


  </div> // ← make sure you're still inside this main return div
);
}
  