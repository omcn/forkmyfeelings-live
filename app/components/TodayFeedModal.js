"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../lib/supabaseClient";

export default function TodayFeedModal({ onClose }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const loadPosts = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("recipe_posts")
        .select("*")
        .gte("created_at", today)
        .order("created_at", { ascending: false });

      if (!error) setPosts(data);
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
        <h2 className="text-lg font-bold">📸 Today’s Forks</h2>
        <button
          onClick={onClose}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ✕ Close
        </button>
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No posts yet today!</p>
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
  );
}
