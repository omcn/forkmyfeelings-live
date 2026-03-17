"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function UsernamePrompt({ userId, onDone }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (!trimmed) { setError("Please enter a username"); return; }
    if (trimmed.length < 3) { setError("Must be at least 3 characters"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setError("Letters, numbers and underscores only"); return; }
    setLoading(true);
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ username: trimmed })
      .eq("id", userId);
    setLoading(false);
    if (dbError) {
      setError(dbError.message.includes("unique") ? "That username is already taken" : dbError.message);
    } else {
      toast.success(`Welcome, @${trimmed}! 🎉`);
      onDone(trimmed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center"
      >
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pick a username</h2>
        <p className="text-gray-500 text-sm mb-6">This is how your friends will find you on Fork My Feels.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-pink-300">
            <span className="pl-4 text-gray-400 text-sm font-medium">@</span>
            <input
              type="text"
              placeholder="yourname"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(""); }}
              className="flex-1 px-2 py-3 text-sm focus:outline-none"
              maxLength={30}
              autoFocus
            />
          </div>
          {error && <p className="text-red-500 text-xs text-left">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-60 text-white font-semibold py-3 rounded-2xl transition"
          >
            {loading ? "Saving…" : "Let's go! 🍴"}
          </button>
          <button
            type="button"
            onClick={() => onDone(null)}
            className="text-xs text-gray-400 hover:text-gray-600 transition"
          >
            Skip for now
          </button>
        </form>
      </motion.div>
    </div>
  );
}
