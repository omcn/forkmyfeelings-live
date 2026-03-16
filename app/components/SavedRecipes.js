"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SavedRecipes({ onClose }) {
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fmf_saved_recipes");
      setSaved(raw ? JSON.parse(raw) : []);
    } catch {
      setSaved([]);
    }
  }, []);

  const remove = (id) => {
    const next = saved.filter((r) => r.id !== id);
    setSaved(next);
    localStorage.setItem("fmf_saved_recipes", JSON.stringify(next));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center">
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 260 }}
        className="w-full max-w-md bg-white rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">❤️ Saved Recipes</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">✕</button>
        </div>

        {saved.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">🍽️</div>
            <p>No saved recipes yet.</p>
            <p className="text-sm mt-1">Tap the heart on any recipe to save it here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {saved.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 p-4 border border-pink-100 rounded-2xl bg-rose-50">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{r.emoji} {r.name}</p>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{r.description}</p>
                </div>
                <button
                  onClick={() => remove(r.id)}
                  className="text-pink-400 hover:text-pink-600 text-xl shrink-0 mt-0.5"
                  title="Remove"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
