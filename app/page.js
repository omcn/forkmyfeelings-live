
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



  const clickSound = new Howl({ src: ["/sounds/click.mp3"], volume: 0.4 });
  const chimeSound = new Howl({ src: ["/sounds/chime.mp3"], volume: 0.4 });
  const bloopSound = new Howl({ src: ["/sounds/bloop.mp3"], volume: 0.4 });

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };

    
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

          <div className="relative w-full h-[600px] flex items-center justify-center">
            {/* Mood Buttons in orbit */}
            <motion.div
              className="absolute"
              style={{
                left: isMobile ? "46%" : "48%",
                top: isMobile ? "50%" : "46%",
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
              {Object.keys(recipes).length === 0 ? (
                <p className="text-gray-500 text-center mt-20">Loading recipes...</p>
              ) : (
                Object.keys(recipes)
                  .filter((moodKey) => moodKey !== "default")
                  .map((moodKey, i, arr) => {
                    const total = arr.length;
                    const ringIndex = i % 2; // alternate layers
                    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
                    const radius = ringIndex === 0 
                      ? isMobile ? 110 : 150 
                      : isMobile ? 170 : 200 ;
                    // const radius = ringIndex === 0 ? 200 : 280;
                    const baseAngle = (360 / (total / 2)) * Math.floor(i / 2)+ 15;
                    // const offset = 360 / total / 2.5; // was /4 before
                    const offset = isMobile ? 360 / total / 3.2 : 360 / total / 2.5;

                    const angle = ringIndex === 0 ? baseAngle : baseAngle + offset;

                    // const total = moodKeys.length;
                    // const half = Math.ceil(total / 2);
                    // const angleStep = 360 / half;
                    // const offset = angleStep / 2;
                    // const angle = ringIndex === 0 ? angleStep * i : angleStep * (i - half) + offset;


                    // const angle = (360 / (total / 2)) * Math.floor(i / 2);
                    // const baseAngle = (360 / (total / 2)) * Math.floor(i / 2);
                    // const angle = ringIndex === 0 ? baseAngle : baseAngle + (360 / total / 4); // offset second ring


                    const x = radius * Math.cos((angle * Math.PI) / 180);
                    const y = radius * Math.sin((angle * Math.PI) / 180);

                    return (
                      <motion.button
                        key={moodKey}
                        style={{
                          position: "absolute",
                          left: `${x}px`,
                          top: `${y}px`,
                          transform: "translate(-50%, -50%)",
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
                        className={`shadow-md px-3 py-1.5 rounded-xl border transition text-sm sm:text-base whitespace-nowrap ${
                          selectedMoods.includes(moodKey)
                            ? "bg-pink-200 border-pink-400"
                            : "bg-white border-gray-300 hover:bg-pink-100"
                        }`}
                      >
                       <MoodTooltip label={moodKey.charAt(0).toUpperCase() + moodKey.slice(1)}>
                        <span>{moodEmojis[moodKey] || "🍽️"}</span>
                      </MoodTooltip>


                      </motion.button>
                    );
                  })
              )}
            </motion.div>

            {/* Rascal centered on same anchor */}
            <motion.img
            src="/rascal-fallback.png"
            alt="Rascal Mascot"
            animate={{ scale: [2, 2.05, 2] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute z-20 rounded-full border-2 border-pink-300 shadow-lg bg-white object-contain"
            style={{
              width: window.innerWidth < 640 ? "64px" : "96px",  // Adjust sizes as needed
              height: window.innerWidth < 640 ? "64px" : "96px",
              // left: "46%",
              // top: "40%",
              // transform: "translate(-50%, -50%)",
              left: isMobile ? "46%" : "46%",
              top: isMobile ? "50%" : "40%",
              transform: "translate(-50%, -50%)",
            }}
          />

          </div>


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





