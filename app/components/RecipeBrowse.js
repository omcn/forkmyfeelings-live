"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import RecipeDetailModal from "./RecipeDetailModal";

const MOODS = ["tired", "happy", "sad", "rushed", "date-night", "chill", "recovering", "bored", "nostalgic", "overwhelmed"];
const PAGE_SIZE = 30;

export default function RecipeBrowse({ onClose, onMakeIt }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterMood, setFilterMood] = useState("");
  const [selected, setSelected] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loadRecipes = useCallback(async (offset = 0) => {
    try {
      const { data, error: fetchError } = await supabase
        .from("recipes")
        .select("*")
        .eq("status", "approved")
        .order("name")
        .range(offset, offset + PAGE_SIZE - 1);
      if (fetchError) throw fetchError;
      const newData = data || [];
      if (newData.length < PAGE_SIZE) setHasMore(false);
      setRecipes((prev) => offset === 0 ? newData : [...prev, ...newData]);
    } catch (err) {
      console.error("Failed to load recipes:", err);
      setError("Could not load recipes. Please try again.");
    }
  }, []);

  useEffect(() => {
    loadRecipes(0).then(() => setLoading(false));
  }, [loadRecipes]);

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
      const moods = Array.isArray(r.moods) ? r.moods : JSON.parse(r.moods || "[]");
      const matchMood = !filterMood || moods.includes(filterMood);
      return matchSearch && matchMood;
    });
  }, [recipes, search, filterMood]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-900">🍴 All Recipes</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl">✕</button>
      </div>

      {/* Search + filter */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <input
          type="text"
          placeholder="Search recipes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilterMood("")}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition ${!filterMood ? "bg-pink-500 text-white border-pink-500" : "bg-white text-gray-600 border-gray-200"}`}
          >
            All
          </button>
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setFilterMood(m === filterMood ? "" : m)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition ${filterMood === m ? "bg-pink-500 text-white border-pink-500" : "bg-white text-gray-600 border-gray-200"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {loading ? (
          <div className="space-y-3 mt-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-pink-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center mt-16 text-gray-400">
            <div className="text-5xl mb-3">😕</div>
            <p className="font-medium">{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
              className="mt-3 text-sm text-pink-600 hover:text-pink-800 font-medium"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center mt-16 text-gray-400">
            <div className="text-5xl mb-3">🔍</div>
            <p className="font-medium">No recipes found.</p>
            <p className="text-sm mt-1">Try a different search or mood filter.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-3">
            {filtered.map((r) => (
              <motion.button
                key={r.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelected(r)}
                className="w-full flex items-start gap-3 p-4 bg-rose-50 border border-pink-100 rounded-2xl text-left"
              >
                <span className="text-3xl shrink-0">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{r.description}</p>
                </div>
              </motion.button>
            ))}
            {hasMore && !search && !filterMood && (
              <button
                onClick={async () => {
                  setLoadingMore(true);
                  await loadRecipes(recipes.length);
                  setLoadingMore(false);
                }}
                disabled={loadingMore}
                className="w-full py-3 text-sm font-semibold text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-2xl transition"
              >
                {loadingMore ? "Loading..." : "Load More Recipes"}
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <RecipeDetailModal
            recipeId={selected.id}
            recipeSummary={selected}
            onClose={() => setSelected(null)}
            onMakeIt={onMakeIt ? (r) => { onMakeIt(r); onClose(); } : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
