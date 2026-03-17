"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function InsightsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cookHistory, setCookHistory] = useState([]);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/"); return; }
      setUser(session.user);

      // Cook history from localStorage
      try {
        const raw = localStorage.getItem("fmf_cook_history");
        setCookHistory(raw ? JSON.parse(raw) : []);
      } catch {}

      // Rating history from Supabase
      const { data: ratings } = await supabase
        .from("recipe_ratings")
        .select("recipe_id, rating, mood, created_at, recipes(name, emoji)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (ratings) {
        setRatingHistory(ratings);
        // Top rated (≥4 stars, unique recipes)
        const seen = new Set();
        const top = ratings
          .filter((r) => r.rating >= 4 && !seen.has(r.recipe_id) && seen.add(r.recipe_id))
          .slice(0, 5);
        setTopRated(top);
      }

      setLoading(false);
    };
    load();
  }, []);

  // Cook streak calculation
  const cookStreak = (() => {
    const days = [...new Set(cookHistory.map((h) => h.cookedAt?.slice(0, 10)).filter(Boolean))]
      .sort()
      .reverse();
    let streak = 0;
    let check = new Date();
    check.setHours(0, 0, 0, 0);
    for (const day of days) {
      const d = new Date(day);
      const diff = Math.round((check - d) / 86400000);
      if (diff === 0 || diff === 1) { streak++; check = d; } else break;
    }
    return streak;
  })();

  // Most cooked recipes
  const mostCooked = (() => {
    const counts = {};
    cookHistory.forEach((h) => {
      if (!h.id) return;
      if (!counts[h.id]) counts[h.id] = { ...h, count: 0 };
      counts[h.id].count++;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  })();

  // Cook frequency last 7 days
  const last7 = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = cookHistory.filter((h) => h.cookedAt?.slice(0, 10) === key).length;
      days.push({ label: d.toLocaleDateString("en-GB", { weekday: "short" }), count });
    }
    return days;
  })();
  const maxCount = Math.max(...last7.map((d) => d.count), 1);

  // Mood usage
  const moodCounts = (() => {
    const counts = {};
    ratingHistory.forEach((r) => {
      if (r.mood) counts[r.mood] = (counts[r.mood] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  })();

  // Average rating given
  const avgRating = ratingHistory.length > 0
    ? (ratingHistory.reduce((s, r) => s + r.rating, 0) / ratingHistory.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 px-4 py-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📊 My Insights</h1>
          <p className="text-sm text-gray-500 mt-0.5">Your cooking journey at a glance</p>
        </div>
        <button onClick={() => router.push("/")} className="text-sm text-pink-600 hover:text-pink-800 font-medium">
          ← Home
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-pink-500">🔥 {cookStreak}</p>
              <p className="text-xs text-gray-500 mt-1">day streak</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-amber-500">{avgRating ?? "—"}</p>
              <p className="text-xs text-gray-500 mt-1">avg rating</p>
            </div>
            <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
              <p className="text-3xl font-bold text-purple-500">{cookHistory.length}</p>
              <p className="text-xs text-gray-500 mt-1">total cooks</p>
            </div>
          </div>

          {/* Cook frequency — last 7 days */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 mb-3">📅 Cooks this week</h2>
            <div className="flex items-end gap-1 h-20">
              {last7.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t bg-pink-400 transition-all"
                    style={{ height: `${(d.count / maxCount) * 60}px`, minHeight: d.count > 0 ? "6px" : "2px", opacity: d.count > 0 ? 1 : 0.2 }}
                  />
                  <span className="text-[10px] text-gray-400">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top rated recipes */}
          {topRated.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 mb-3">⭐ Your Top Recipes</h2>
              <div className="space-y-2">
                {topRated.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{r.recipes?.emoji || "🍽️"}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800 truncate">{r.recipes?.name || "Recipe"}</span>
                    <span className="text-amber-500 font-bold text-sm">{"⭐".repeat(r.rating)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most cooked */}
          {mostCooked.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 mb-3">🍳 Most Cooked</h2>
              <div className="space-y-2">
                {mostCooked.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">{r.emoji || "🍽️"}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800 truncate">{r.name}</span>
                    <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full font-semibold">×{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mood usage */}
          {moodCounts.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h2 className="text-sm font-bold text-gray-700 mb-3">🧠 Your Top Moods</h2>
              <div className="space-y-2">
                {moodCounts.map(([mood, count]) => {
                  const maxMood = moodCounts[0][1];
                  return (
                    <div key={mood} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-700 w-24 capitalize">{mood}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 bg-pink-400 rounded-full"
                          style={{ width: `${(count / maxMood) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-4 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {cookHistory.length === 0 && ratingHistory.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">🍳</div>
              <p className="font-medium">Nothing to show yet.</p>
              <p className="text-sm mt-1">Cook a recipe and rate it to start building your insights!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
