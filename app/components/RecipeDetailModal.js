"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";

export default function RecipeDetailModal({ recipeId, recipeSummary, onClose }) {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();
      setRecipe(!error && data ? data : null);
      setLoading(false);
    };
    fetch();
  }, [recipeId]);

  const ingredients = recipe
    ? Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : JSON.parse(recipe.ingredients || "[]")
    : [];

  const steps = recipe
    ? Array.isArray(recipe.steps)
      ? recipe.steps
      : JSON.parse(recipe.steps || "[]")
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center" onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="w-full max-w-md bg-white rounded-t-3xl p-6 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900 pr-4">
            {recipeSummary?.emoji} {recipeSummary?.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl shrink-0">✕</button>
        </div>

        {loading ? (
          <div className="space-y-3 py-6">
            <div className="h-4 bg-pink-100 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-pink-100 rounded animate-pulse w-1/2" />
            <div className="h-4 bg-pink-100 rounded animate-pulse w-2/3" />
          </div>
        ) : !recipe ? (
          <div className="text-center py-10 text-gray-400">
            <div className="text-4xl mb-2">😕</div>
            <p>Couldn't load this recipe right now.</p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-5 leading-relaxed">{recipe.description}</p>

            {ingredients.length > 0 && (
              <div className="mb-5">
                <h3 className="font-semibold text-gray-800 mb-2">🧂 Ingredients</h3>
                <ul className="space-y-1">
                  {ingredients.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-pink-400 mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {steps.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">👨‍🍳 Steps</h3>
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                      <span className="bg-pink-500 text-white font-bold rounded-full w-6 h-6 flex items-center justify-center shrink-0 text-xs mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
