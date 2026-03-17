"use client";
import { motion, useMotionValue, useTransform } from "framer-motion";

export default function RecipeCard({
  recipe,
  recipeAvgRating,
  savedIds,
  onToggleFavourite,
  onMakeIt,
  onReshuffle,
  onShare,
  onShoppingList,
  haptic,
  bloopSound,
  submitRecipeRating,
}) {
  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-160, 160], [-10, 10]);
  const swipeLeftOpacity = useTransform(dragX, [-160, -20], [1, 0]);
  const swipeRightOpacity = useTransform(dragX, [20, 160], [0, 1]);

  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : JSON.parse(recipe.ingredients || "[]");

  // Build schema.org Recipe structured data for SEO
  const recipeSchema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    description: recipe.description || `A mood-matched recipe from Fork My Feels`,
    recipeIngredient: ingredients,
    recipeInstructions: (Array.isArray(recipe.steps) ? recipe.steps : JSON.parse(recipe.steps || "[]")).map(
      (step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        text: step,
      })
    ),
    ...(recipeAvgRating !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: recipeAvgRating,
        bestRating: 5,
      },
    }),
    author: { "@type": "Organization", name: "Fork My Feels" },
    datePublished: recipe.created_at || new Date().toISOString(),
    recipeCategory: "Mood-based",
  };

  return (
    <div className="relative mt-8 w-full max-w-md">
      {/* Schema.org Recipe structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeSchema) }}
      />
      {/* Swipe hints */}
      <motion.div
        style={{ opacity: swipeLeftOpacity }}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none z-10 flex flex-col items-center gap-1"
      >
        <span className="text-2xl">🔄</span>
        <span>Reshuffle</span>
      </motion.div>
      <motion.div
        style={{ opacity: swipeRightOpacity }}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-pink-400 pointer-events-none z-10 flex flex-col items-center gap-1"
      >
        <span className="text-2xl">❤️</span>
        <span>Save</span>
      </motion.div>

      <motion.div
        key="recipe-card"
        style={{ rotate: cardRotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.25}
        onDrag={(_, info) => dragX.set(info.offset.x)}
        onDragEnd={(_, info) => {
          dragX.set(0);
          if (info.offset.x > 100) {
            haptic?.("success");
            onToggleFavourite(recipe);
          } else if (info.offset.x < -100) {
            haptic?.("light");
            bloopSound?.play();
            onReshuffle();
          }
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-2xl shadow-xl p-6 cursor-grab active:cursor-grabbing select-none"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            {recipe.emoji} {recipe.name}
          </h2>
          <button
            onClick={() => {
              haptic?.("success");
              onToggleFavourite(recipe);
            }}
            className="text-2xl shrink-0 transition-transform active:scale-125"
            title={savedIds.has(recipe.id) ? "Remove from saved" : "Save recipe"}
            aria-label={savedIds.has(recipe.id) ? "Remove from saved" : "Save recipe"}
          >
            {savedIds.has(recipe.id) ? "❤️" : "🤍"}
          </button>
        </div>
        <p className="text-gray-700 mb-2">{recipe.description}</p>
        {recipeAvgRating !== null && (
          <p className="text-sm text-amber-500 mb-4">
            {"⭐".repeat(Math.round(recipeAvgRating))} {recipeAvgRating.toFixed(1)} / 5
          </p>
        )}
        {recipe.ingredients && (
          <div className="text-left text-gray-800 mb-4">
            <h3 className="font-semibold mb-1">🧂 Ingredients</h3>
            <ul className="list-disc list-inside">
              {ingredients.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {recipe.steps && (
          <motion.button
            onClick={onMakeIt}
            whileTap={{ scale: 0.96 }}
            className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl shadow-sm transition"
          >
            Let's Make It →
          </motion.button>
        )}

        <motion.button
          onClick={() => {
            bloopSound?.play();
            submitRecipeRating(0);
            onReshuffle();
          }}
          whileTap={{ scale: 0.96 }}
          className="mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl transition"
        >
          I'm not feeling it
        </motion.button>

        {typeof navigator !== "undefined" && navigator.share && (
          <motion.button
            onClick={onShare}
            whileTap={{ scale: 0.96 }}
            className="mt-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded-xl transition"
          >
            📤 Share Recipe
          </motion.button>
        )}

        <motion.button
          onClick={onShoppingList}
          whileTap={{ scale: 0.96 }}
          className="mt-3 bg-green-100 hover:bg-green-200 text-green-800 font-medium py-2 px-4 rounded-xl transition"
        >
          🛒 Let's Go Shopping
        </motion.button>
      </motion.div>
    </div>
  );
}
