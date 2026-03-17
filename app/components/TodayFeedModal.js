"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";

export default function TodayFeedModal({ onClose }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const { data, error: fetchError } = await supabase
          .from("recipe_posts")
          .select("*, profiles(username, avatar_url), recipes(name, emoji)")
          .gte("created_at", today)
          .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;
        setPosts(data || []);
      } catch (err) {
        console.error("Feed load error:", err);
        setError("Could not load today's feed.");
      }
      setLoading(false);
    };

    loadPosts();
  }, []);

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 120 }}
      className="fixed inset-0 bg-white z-50 overflow-y-auto px-4 pt-6 pb-16"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Today's Forks</h2>
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700"
          aria-label="Close feed"
        >
          Close
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-50 p-4 rounded-xl shadow-md animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-pink-100" />
                <div className="flex-1">
                  <div className="h-3 bg-pink-100 rounded w-24 mb-1.5" />
                  <div className="h-2 bg-gray-100 rounded w-16" />
                </div>
              </div>
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-3" />
              <div className="h-3 bg-gray-100 rounded w-32" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">😕</div>
          <p className="font-medium">{error}</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📸</div>
          <p className="font-medium">No posts yet today!</p>
          <p className="text-sm mt-1">Cook a recipe and share a photo to start the feed.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-gray-50 p-4 rounded-xl shadow-md"
            >
              {/* Author header */}
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={post.profiles?.avatar_url || "/rascal-fallback.png"}
                  alt=""
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover border border-pink-100"
                  unoptimized={!!post.profiles?.avatar_url}
                />
                <div>
                  <p className="font-semibold text-sm text-gray-900">
                    {post.profiles?.username ? `@${post.profiles.username}` : "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(post.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {post.recipes && (
                  <span className="ml-auto text-sm text-gray-500">
                    {post.recipes.emoji} {post.recipes.name}
                  </span>
                )}
              </div>

              {/* Photo */}
              {post.photo_url && (
                <Image
                  src={post.photo_url}
                  alt="Post"
                  width={400}
                  height={300}
                  className="rounded-lg mb-2 w-full object-cover"
                  unoptimized
                />
              )}

              <div className="text-sm text-gray-700 flex items-center gap-3">
                {post.moods && (
                  <span>Mood: {Array.isArray(post.moods) ? post.moods.join(", ") : post.moods}</span>
                )}
                {post.rating > 0 && <span>{"⭐".repeat(post.rating)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
