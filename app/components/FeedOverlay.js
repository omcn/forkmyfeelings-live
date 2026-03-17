"use client";
import { motion } from "framer-motion";

export default function FeedOverlay({
  posts,
  feedTab,
  setFeedTab,
  feedReactions,
  reactionCounts,
  friendIds,
  feedRefreshing,
  onRefresh,
  onReact,
  onClose,
}) {
  const visiblePosts =
    feedTab === "friends"
      ? posts.filter((p) => friendIds.has(p.user_id))
      : posts;

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 120 }}
      className="fixed inset-0 bg-white z-50 overflow-y-auto px-4 pt-6 pb-16"
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">📸 Today's Forks</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={feedRefreshing}
            className="text-xs text-pink-500 hover:text-pink-700 font-semibold disabled:opacity-50"
          >
            {feedRefreshing ? "↻ Loading…" : "↻ Refresh"}
          </button>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700"
            aria-label="Close feed"
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* All / Friends tab toggle */}
      <div className="flex gap-2 mb-4" role="tablist">
        {[
          { key: "all", label: "🌍 All" },
          { key: "friends", label: "👥 Friends" },
        ].map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={feedTab === t.key}
            onClick={() => setFeedTab(t.key)}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
              feedTab === t.key
                ? "bg-pink-500 text-white shadow"
                : "bg-white text-gray-600 border border-pink-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visiblePosts.length === 0 ? (
        <div className="text-center mt-16">
          <div className="text-5xl mb-3">
            {feedTab === "friends" ? "👥" : "📭"}
          </div>
          <p className="text-gray-500 font-medium">
            {feedTab === "friends"
              ? "No friend posts yet today!"
              : "No posts yet today!"}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {feedTab === "friends"
              ? "Your friends haven't cooked yet — or add some friends first 🤝"
              : "Cook something and share it to be the first 🍴"}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {visiblePosts.map((post) => {
            const author = post.profiles;
            const myReaction = feedReactions[post.id];
            const rxCounts = reactionCounts[post.id] || {};
            return (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Author row */}
                <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                  <a href={`/user/${post.user_id}`}>
                    <img
                      src={author?.avatar_url || "/rascal-fallback.png"}
                      alt={author?.username ? `${author.username}'s avatar` : "User avatar"}
                      className="w-8 h-8 rounded-full object-cover border border-pink-200"
                    />
                  </a>
                  <div>
                    <a
                      href={`/user/${post.user_id}`}
                      className="text-sm font-semibold text-gray-800 hover:text-pink-600 transition"
                    >
                      {author?.username
                        ? `@${author.username}`
                        : "Anonymous Chef"}
                    </a>
                    <p className="text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                {/* Photo */}
                {post.photo_url && (
                  <img
                    src={post.photo_url}
                    alt={`${author?.username || "User"}'s recipe post`}
                    className="w-full object-cover max-h-72"
                  />
                )}
                {/* Meta + reactions */}
                <div className="px-4 py-3">
                  {post.recipes && (
                    <p className="font-semibold text-gray-900 mb-1">
                      {post.recipes.emoji} {post.recipes.name}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>
                      🧠{" "}
                      {Array.isArray(post.moods)
                        ? post.moods.join(", ")
                        : post.moods}
                    </span>
                    {post.rating > 0 && (
                      <span>{"⭐".repeat(Math.min(post.rating, 5))}</span>
                    )}
                  </div>
                  {/* Emoji reactions with counts */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {["😍", "🤤", "👏", "🔥", "❤️"].map((emoji) => {
                      const count = rxCounts[emoji] || 0;
                      return (
                        <button
                          key={emoji}
                          onClick={() => onReact(post.id, emoji)}
                          aria-label={`React with ${emoji}`}
                          className={`flex items-center gap-0.5 text-sm rounded-full px-2 py-0.5 transition ${
                            myReaction === emoji
                              ? "bg-pink-100 ring-1 ring-pink-300"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {emoji}
                          {count > 0 && (
                            <span className="text-xs text-gray-500 ml-0.5">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
