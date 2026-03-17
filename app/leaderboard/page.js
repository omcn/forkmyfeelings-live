"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";

export default function LeaderboardPage() {
  const [topRecipes, setTopRecipes] = useState([]);
  const [topChefs, setTopChefs] = useState([]);
  const [tab, setTab] = useState("recipes"); // "recipes" | "chefs"
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      // Top-rated recipes: average rating per recipe, min 2 ratings
      const { data: ratingData } = await supabase
        .from("recipe_ratings")
        .select("recipe_id, rating");

      if (ratingData) {
        const grouped = {};
        ratingData.forEach(({ recipe_id, rating }) => {
          if (!grouped[recipe_id]) grouped[recipe_id] = [];
          grouped[recipe_id].push(rating);
        });

        const averages = Object.entries(grouped)
          .filter(([, ratings]) => ratings.length >= 2)
          .map(([id, ratings]) => ({
            id: Number(id),
            avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
            count: ratings.length,
          }))
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 10);

        if (averages.length > 0) {
          const ids = averages.map((r) => r.id);
          const { data: recipes } = await supabase
            .from("recipes")
            .select("id, name, emoji, description")
            .in("id", ids);

          if (recipes) {
            const enriched = averages.map((a) => ({
              ...a,
              ...recipes.find((r) => r.id === a.id),
            }));
            setTopRecipes(enriched);
          }
        }
      }

      // Top chefs: most posts this week
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: posts } = await supabase
        .from("recipe_posts")
        .select("user_id, profiles(username, avatar_url)")
        .gte("created_at", weekAgo);

      if (posts) {
        const chefMap = {};
        posts.forEach(({ user_id, profiles: profile }) => {
          if (!chefMap[user_id]) chefMap[user_id] = { user_id, profile, count: 0 };
          chefMap[user_id].count++;
        });

        const sorted = Object.values(chefMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setTopChefs(sorted);
      }

      setLoading(false);
    };
    load();

    // Real-time refresh when new ratings or posts come in
    const ratingsSub = supabase
      .channel("leaderboard-ratings")
      .on("postgres_changes", { event: "*", schema: "public", table: "recipe_ratings" }, () => load())
      .subscribe();

    const postsSub = supabase
      .channel("leaderboard-posts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "recipe_posts" }, () => load())
      .subscribe();

    return () => {
      supabase.removeChannel(ratingsSub);
      supabase.removeChannel(postsSub);
    };
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 px-4 py-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🏆 Leaderboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Top recipes & chefs this week</p>
        </div>
        <button onClick={() => router.push("/")} className="text-sm text-pink-600 hover:text-pink-800 font-medium">
          ← Home
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: "recipes", label: "⭐ Top Recipes" },
          { key: "chefs", label: "👨‍🍳 Top Chefs" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
              tab === t.key ? "bg-pink-500 text-white shadow" : "bg-white text-gray-600 border border-pink-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : tab === "recipes" ? (
        topRecipes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-3">⭐</div>
            <p className="font-medium">Not enough ratings yet.</p>
            <p className="text-sm mt-1">Cook and rate recipes to build the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topRecipes.map((r, i) => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <span className="text-2xl w-8 text-center shrink-0">{medals[i] || `${i + 1}`}</span>
                <span className="text-2xl shrink-0">{r.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.count} rating{r.count !== 1 ? "s" : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-amber-500">{r.avg.toFixed(1)}</p>
                  <p className="text-xs text-gray-400">/ 5 ⭐</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : topChefs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👨‍🍳</div>
          <p className="font-medium">No posts yet this week.</p>
          <p className="text-sm mt-1">Share a photo of your cook to appear here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {topChefs.map((c, i) => (
            <div key={c.user_id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
              <span className="text-2xl w-8 text-center shrink-0">{medals[i] || `${i + 1}`}</span>
              <Image
                src={c.profile?.avatar_url || "/rascal-fallback.png"}
                alt=""
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover border-2 border-pink-200 shrink-0"
                unoptimized={!!c.profile?.avatar_url}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">
                  {c.profile?.username ? `@${c.profile.username}` : "Anonymous Chef"}
                </p>
                <p className="text-xs text-gray-400">this week</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-pink-500">{c.count}</p>
                <p className="text-xs text-gray-400">post{c.count !== 1 ? "s" : ""}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
