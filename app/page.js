
"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";

import AuthForm from "./components/AuthForm";
import RecipePostCapture from "./components/RecipePostCapture";
import { supabase } from "../lib/supabaseClient";
import { getMealSuggestions } from "../utils/mealSuggestionEngine";

import { useWindowSize } from "@uidotdev/usehooks";
import Onboarding from "./components/Onboarding";
import SavedRecipes from "./components/SavedRecipes";
import NotificationPrompt from "./components/NotificationPrompt";
import RecipeBrowse from "./components/RecipeBrowse";
import UsernamePrompt from "./components/UsernamePrompt";
import toast from "react-hot-toast";
import fallbackRecipes from "../data/recipes";

// Extracted components
import MoodSelector from "./components/MoodSelector";
import RecipeCard from "./components/RecipeCard";
import CookingMode from "./components/CookingMode";
import ShoppingListModal from "./components/ShoppingListModal";
import FeedOverlay from "./components/FeedOverlay";
import OfflineIndicator from "./components/OfflineIndicator";

/** Safely parse a JSON array from localStorage with validation */
function safeParseArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    try { localStorage.removeItem(key); } catch {}
    return [];
  }
}

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [recipes, setRecipes] = useState(fallbackRecipes);
  const [recipe, setRecipe] = useState(null);
  const [cookingMode, setCookingMode] = useState(false);
  const [showSuggestionMessage, setShowSuggestionMessage] = useState(false);
  const [showRecipeCard, setShowRecipeCard] = useState(false);
  const [user, setUser] = useState(null);
  const { width: windowWidth } = useWindowSize();
  const isMobile = (windowWidth || 0) < 768;
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [moodRating, setMoodRating] = useState(0);
  const [showPostCapture, setShowPostCapture] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [posts, setPosts] = useState([]);
  const [debugMessage, setDebugMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTiming, setIsTiming] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [noRecipesFound, setNoRecipesFound] = useState(false);
  const [recipeAvgRating, setRecipeAvgRating] = useState(null);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [feedReactions, setFeedReactions] = useState({});
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [friendIds, setFriendIds] = useState(new Set());
  const [reactionCounts, setReactionCounts] = useState({});
  const [feedTab, setFeedTab] = useState("all");
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [savedIds, setSavedIds] = useState(() => {
    if (typeof window === "undefined") return new Set();
    return new Set(safeParseArray("fmf_saved_recipes").map((r) => r.id));
  });

  // Haptic utility
  const haptic = (type = "light") => {
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    const patterns = { light: [10], medium: [25], heavy: [50], success: [10, 50, 10], error: [200] };
    navigator.vibrate(patterns[type] || [10]);
  };

  // Start cooking from Browse / Saved overlays
  const handleMakeItFromBrowse = (r) => {
    setShowBrowse(false);
    setShowSaved(false);
    setRecipe(r);
    setCookingMode(true);
    setShowRecipeCard(false);
    setShowSuggestionMessage(false);
    setTimeLeft(null);
    setIsTiming(false);
    haptic("success");
    // Cache recipe for offline cooking
    navigator.serviceWorker?.controller?.postMessage({
      type: "CACHE_RECIPE",
      recipe: { ...r, steps: r.steps, ingredients: r.ingredients },
    });
    try {
      const raw = localStorage.getItem("fmf_cook_history");
      const history = raw ? JSON.parse(raw) : [];
      const entry = { id: r.id, name: r.name, emoji: r.emoji, cookedAt: new Date().toISOString() };
      const deduped = [entry, ...history.filter((h) => h.id !== r.id)].slice(0, 20);
      localStorage.setItem("fmf_cook_history", JSON.stringify(deduped));
    } catch {}
  };

  const clickSound = useMemo(() => new Howl({ src: ["/sounds/click.mp3"], volume: 0.4 }), []);
  const chimeSound = useMemo(() => new Howl({ src: ["/sounds/chime.mp3"], volume: 0.4 }), []);
  const bloopSound = useMemo(() => new Howl({ src: ["/sounds/bloop.mp3"], volume: 0.4 }), []);

  const submitRecipeRating = async (ratingValue) => {
    if (!user || !recipe) return;
    const { error } = await supabase.from("recipe_ratings").insert([
      {
        user_id: user.id,
        recipe_id: recipe.id,
        rating: ratingValue,
        mood: selectedMoods[0] || null,
      },
    ]);
    if (error) {
      console.error("Failed to save rating:", error.message);
    }
  };

  const refreshFeed = async () => {
    setFeedRefreshing(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("recipe_posts")
        .select("*, profiles(username, avatar_url), recipes(name, emoji)")
        .gte("created_at", today)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      if (data) {
        setPosts(data);
        if (data.length > 0 && user) {
          const postIds = data.map((p) => p.id);
          const [{ data: rxData }, { data: myRx }] = await Promise.all([
            supabase.from("post_reactions").select("post_id, emoji").in("post_id", postIds),
            supabase.from("post_reactions").select("post_id, emoji")
              .eq("user_id", user.id).in("post_id", postIds),
          ]);
          if (rxData) {
            const counts = {};
            rxData.forEach(({ post_id, emoji }) => {
              if (!counts[post_id]) counts[post_id] = {};
              counts[post_id][emoji] = (counts[post_id][emoji] || 0) + 1;
            });
            setReactionCounts(counts);
          }
          if (myRx) {
            const rxMap = {};
            myRx.forEach(({ post_id, emoji }) => { rxMap[post_id] = emoji; });
            setFeedReactions(rxMap);
          }
        }
        toast.success(`Feed refreshed — ${data.length} post${data.length !== 1 ? "s" : ""}`);
      }
    } catch (err) {
      console.error("Feed refresh failed:", err);
      toast.error("Couldn't refresh feed. Try again.");
    } finally {
      setFeedRefreshing(false);
    }
  };

  const reactToPost = async (postId, emoji) => {
    const current = feedReactions[postId];
    const isRemoving = current === emoji;

    const nextReactions = isRemoving
      ? Object.fromEntries(Object.entries(feedReactions).filter(([k]) => k !== String(postId)))
      : { ...feedReactions, [postId]: emoji };
    setFeedReactions(nextReactions);
    localStorage.setItem("fmf_feed_reactions", JSON.stringify(nextReactions));

    setReactionCounts((prev) => {
      const post = { ...(prev[postId] || {}) };
      if (isRemoving) {
        post[current] = Math.max((post[current] || 1) - 1, 0);
      } else {
        if (current) post[current] = Math.max((post[current] || 1) - 1, 0);
        post[emoji] = (post[emoji] || 0) + 1;
      }
      return { ...prev, [postId]: post };
    });

    if (!user) return;

    if (isRemoving) {
      await supabase.from("post_reactions").delete()
        .eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_reactions").upsert(
        { post_id: postId, user_id: user.id, emoji },
        { onConflict: "post_id,user_id" }
      );
      const reactedPost = posts.find((p) => p.id === postId);
      if (reactedPost && reactedPost.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: reactedPost.user_id,
          type: "reaction",
          actor_id: user.id,
          resource_id: String(postId),
          read: false,
        });
      }
    }
  };

  const toggleFavourite = async (r) => {
    if (!r?.id) return;
    const raw = localStorage.getItem("fmf_saved_recipes");
    const arr = raw ? JSON.parse(raw) : [];
    const isSaved = savedIds.has(r.id);
    let next;
    if (isSaved) {
      next = arr.filter((x) => x.id !== r.id);
      // Undo toast for unsaving
      toast(
        (t) => (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span>Removed {r.emoji} {r.name}</span>
            <button
              onClick={() => {
                const restored = [...next, { id: r.id, name: r.name, emoji: r.emoji, description: r.description }];
                localStorage.setItem("fmf_saved_recipes", JSON.stringify(restored));
                setSavedIds(new Set(restored.map((x) => x.id)));
                if (user) {
                  supabase.from("saved_recipes").upsert(
                    { user_id: user.id, recipe_id: r.id },
                    { onConflict: "user_id,recipe_id" }
                  );
                }
                toast.dismiss(t.id);
              }}
              style={{ fontWeight: "bold", color: "#ec4899", whiteSpace: "nowrap" }}
            >
              Undo
            </button>
          </div>
        ),
        { duration: 5000, icon: "💔" }
      );
    } else {
      next = [...arr, { id: r.id, name: r.name, emoji: r.emoji, description: r.description }];
      toast.success("Saved! ❤️");
    }
    localStorage.setItem("fmf_saved_recipes", JSON.stringify(next));
    setSavedIds(new Set(next.map((x) => x.id)));
    if (user) {
      if (isSaved) {
        await supabase.from("saved_recipes").delete()
          .eq("user_id", user.id).eq("recipe_id", r.id);
      } else {
        await supabase.from("saved_recipes").upsert(
          { user_id: user.id, recipe_id: r.id },
          { onConflict: "user_id,recipe_id" }
        );
      }
    }
  };

  // Timer countdown
  useEffect(() => {
    if (isTiming && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isTiming && timeLeft === 0) {
      setIsTiming(false);
      localStorage.removeItem("fmf_timer_end");
      navigator.serviceWorker?.controller?.postMessage({ type: "TIMER_CLEAR" });
      new Howl({ src: ["/sounds/chime.mp3"], volume: 0.5 }).play();
      haptic("success");
    }
  }, [timeLeft, isTiming]);

  // Resync timer on visibility change
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const stored = localStorage.getItem("fmf_timer_end");
      if (!stored) return;
      const remaining = Math.ceil((parseInt(stored) - Date.now()) / 1000);
      if (remaining > 0) {
        setTimeLeft(remaining);
        setIsTiming(true);
      } else {
        localStorage.removeItem("fmf_timer_end");
        setTimeLeft(0);
        setIsTiming(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // App initialization
  useEffect(() => {
    let listener;
    let isMounted = true;

    const initApp = async () => {
      try {
      const today = new Date().toISOString().slice(0, 10);

      // Run auth + data queries in parallel — don't let auth block everything
      const [sessionResult, postsResult, recipesResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from("recipe_posts")
          .select("*, profiles(username, avatar_url), recipes(name, emoji)")
          .gte("created_at", today)
          .order("created_at", { ascending: false }),
        supabase
          .from("recipes")
          .select("*")
          .eq("status", "approved"),
      ]);

      if (!isMounted) return;
      const currentUser = sessionResult.data?.session?.user;
      setUser(currentUser);

      const postData = !postsResult.error ? (postsResult.data || []) : [];
      setPosts(postData);

      // Only show these 7 moods — remap legacy DB tags to their parents
      const VALID_MOODS = new Set(["tired", "happy", "sad", "rushed", "date-night", "chill", "overwhelmed"]);
      const MOOD_REMAP = { recovering: "tired", bored: "chill", nostalgic: "sad" };

      if (!recipesResult.error && recipesResult.data?.length > 0) {
        const formatted = {};
        recipesResult.data.forEach((recipe) => {
          const moods = typeof recipe.moods === "string"
            ? JSON.parse(recipe.moods)
            : recipe.moods;
          moods.forEach((mood) => {
            const mapped = MOOD_REMAP[mood] || mood;
            if (!VALID_MOODS.has(mapped)) return;
            if (!formatted[mapped]) formatted[mapped] = [];
            formatted[mapped].push(recipe);
          });
        });
        setRecipes(formatted);
      } else {
        // Use local fallback recipes if DB returned nothing
        setRecipes(fallbackRecipes);
      }

      const lastMood = localStorage.getItem("lastMood");
      if (lastMood) setSelectedMoods([lastMood]);

      if (!localStorage.getItem("fmf_onboarded")) setShowOnboarding(true);

      // Run all user-specific queries in parallel
      if (currentUser) {
        const postIds = postData.length > 0 ? postData.map((p) => p.id) : [];

        const userQueries = [
          // 0: username check
          !localStorage.getItem("fmf_username_set")
            ? supabase.from("profiles").select("username").eq("id", currentUser.id).single()
            : Promise.resolve({ data: { username: true } }),
          // 1: friends
          supabase.from("friends").select("user_id, friend_id").eq("status", "accepted")
            .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`),
          // 2: saved recipes
          supabase.from("saved_recipes").select("recipe_id, recipes(id, name, emoji, description)")
            .eq("user_id", currentUser.id),
          // 3: notifications count
          supabase.from("notifications").select("*", { count: "exact", head: true })
            .eq("user_id", currentUser.id).eq("read", false),
          // 4: reaction counts (if posts exist)
          postIds.length > 0
            ? supabase.from("post_reactions").select("post_id, emoji").in("post_id", postIds)
            : Promise.resolve({ data: null }),
          // 5: my reactions (if posts exist)
          postIds.length > 0
            ? supabase.from("post_reactions").select("post_id, emoji")
                .eq("user_id", currentUser.id).in("post_id", postIds)
            : Promise.resolve({ data: null }),
        ];

        const [profResult, friendResult, savedResult, notifResult, rxResult, myRxResult] = await Promise.all(userQueries);
        if (!isMounted) return;

        // Username check
        if (!localStorage.getItem("fmf_username_set")) {
          if (!profResult.data?.username) setShowUsernamePrompt(true);
          else localStorage.setItem("fmf_username_set", "1");
        }

        // Friends
        if (friendResult.data) {
          setFriendIds(new Set(friendResult.data.map((f) =>
            f.user_id === currentUser.id ? f.friend_id : f.user_id
          )));
        }

        // Saved recipes
        if (savedResult.data?.length > 0) {
          const savedArr = savedResult.data.map((s) => s.recipes).filter(Boolean);
          localStorage.setItem("fmf_saved_recipes", JSON.stringify(savedArr));
          setSavedIds(new Set(savedArr.map((r) => r.id)));
        }

        // Notifications
        if (notifResult.count) setUnreadNotifs(notifResult.count);

        // Reaction counts
        if (rxResult.data) {
          const counts = {};
          rxResult.data.forEach(({ post_id, emoji }) => {
            if (!counts[post_id]) counts[post_id] = {};
            counts[post_id][emoji] = (counts[post_id][emoji] || 0) + 1;
          });
          setReactionCounts(counts);
        }

        // My reactions
        if (myRxResult.data) {
          const rxMap = {};
          myRxResult.data.forEach(({ post_id, emoji }) => { rxMap[post_id] = emoji; });
          setFeedReactions(rxMap);
          localStorage.setItem("fmf_feed_reactions", JSON.stringify(rxMap));
        }
      }

      try {
        const raw = localStorage.getItem("fmf_feed_reactions");
        if (raw && !currentUser) setFeedReactions(JSON.parse(raw));
      } catch {}

      // Check if redirected from profile to start cooking
      try {
        const startCooking = localStorage.getItem("fmf_start_cooking");
        if (startCooking) {
          localStorage.removeItem("fmf_start_cooking");
          const cookRecipe = JSON.parse(startCooking);
          setRecipe(cookRecipe);
          setCookingMode(true);
        }
      } catch {}

      } catch (err) {
        console.error("App init error:", err);
      }
    };

    initApp();

    listener = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "SIGNED_IN") setUser(session.user);
      if (event === "SIGNED_OUT") setUser(null);
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleMultiMoodSubmit = async () => {
    if (selectedMoods.length === 0) return;

    const allMatchingRecipes = selectedMoods.flatMap((mood) => recipes[mood] || []);
    const uniqueRecipes = Array.from(new Map(
      allMatchingRecipes.map((recipe) => [recipe.id, recipe])
    ).values());

    if (uniqueRecipes.length === 0) {
      setNoRecipesFound(true);
      return;
    }

    setNoRecipesFound(false);

    const lastSuggestedId = localStorage.getItem("lastMealId");
    let cookHistory = [];
    try {
      const cookHistoryRaw = localStorage.getItem("fmf_cook_history");
      cookHistory = cookHistoryRaw ? JSON.parse(cookHistoryRaw) : [];
    } catch {}

    // Fetch ratings in parallel with a 3s timeout — fall back to empty if slow
    let userRatings = [];
    let globalRatings = [];

    if (user?.id) {
      try {
        const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
        const [userResult, globalResult] = await Promise.race([
          Promise.all([
            supabase.from("recipe_ratings").select("recipe_id, rating, mood").eq("user_id", user.id).in("mood", selectedMoods),
            supabase.from("recipe_ratings").select("recipe_id, rating, mood").in("mood", selectedMoods),
          ]),
          timeout(1500),
        ]);
        if (!userResult.error) userRatings = userResult.data || [];
        if (!globalResult.error) globalRatings = globalResult.data || [];
      } catch {
        // Timeout or error — proceed with empty ratings (random suggestion)
      }
    }

    const [suggestion] = getMealSuggestions({
      userRatings,
      globalRatings,
      recipes: uniqueRecipes,
      selectedMoods,
      lastSuggestedId: Number(lastSuggestedId),
      cookHistory,
    });

    if (!suggestion) {
      setNoRecipesFound(true);
      return;
    }

    const recipeRatings = globalRatings.filter((r) => r.recipe_id === suggestion.id);
    if (recipeRatings.length > 0) {
      const avg = recipeRatings.reduce((sum, r) => sum + r.rating, 0) / recipeRatings.length;
      setRecipeAvgRating(Math.round(avg * 10) / 10);
    } else {
      setRecipeAvgRating(null);
    }

    localStorage.setItem("lastMealId", suggestion.id);
    setRecipe(suggestion);
    setMoodRating(0);
    setCookingMode(false);
    setShowSuggestionMessage(true);
    setShowRecipeCard(false);

    setTimeout(() => {
      setShowSuggestionMessage(false);
      setShowRecipeCard(true);
    }, 2000);
  };

  const handleReshuffle = () => {
    setRecipe(null);
    setShowRecipeCard(false);
    setShowSuggestionMessage(false);
    setCookingMode(false);
  };

  const handleMakeIt = () => {
    setCookingMode(true);
    // Cache recipe for offline cooking
    navigator.serviceWorker?.controller?.postMessage({
      type: "CACHE_RECIPE",
      recipe: { ...recipe, steps: recipe.steps, ingredients: recipe.ingredients },
    });
    try {
      const raw = localStorage.getItem("fmf_cook_history");
      const history = raw ? JSON.parse(raw) : [];
      const entry = { id: recipe.id, name: recipe.name, emoji: recipe.emoji, cookedAt: new Date().toISOString() };
      const deduped = [entry, ...history.filter((h) => h.id !== recipe.id)].slice(0, 20);
      localStorage.setItem("fmf_cook_history", JSON.stringify(deduped));
    } catch {}
  };

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [feedMeLoading, setFeedMeLoading] = useState(false);

  // Guest-friendly: prompt sign-in instead of blocking
  const requireAuth = (action) => {
    if (user) return true;
    setShowAuthModal(true);
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-4 py-12 text-center font-sans overflow-x-hidden">
      <OfflineIndicator />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
      {showUsernamePrompt && user && (
        <UsernamePrompt
          userId={user.id}
          onDone={() => {
            setShowUsernamePrompt(false);
            localStorage.setItem("fmf_username_set", "1");
          }}
        />
      )}
      <AnimatePresence>{showSaved && <SavedRecipes onClose={() => setShowSaved(false)} onMakeIt={handleMakeItFromBrowse} />}</AnimatePresence>
      <AnimatePresence>{showBrowse && <RecipeBrowse onClose={() => setShowBrowse(false)} onMakeIt={handleMakeItFromBrowse} />}</AnimatePresence>
      {showRecipeCard && <NotificationPrompt />}

      {/* Top-left navigation */}
      <nav className="absolute top-4 left-4 flex items-center gap-2" aria-label="Main navigation">
        <button
          onClick={() => { if (requireAuth()) setShowSaved(true); }}
          className="bg-white/80 hover:bg-white border border-pink-200 text-pink-600 text-xs font-semibold px-3 py-2 rounded-full shadow-sm transition flex items-center gap-1"
          aria-label="Open saved recipes"
        >
          ❤️ Saved
        </button>
        <button
          onClick={() => { if (requireAuth()) setShowFeed(true); }}
          className="bg-white/80 hover:bg-white border border-pink-200 text-pink-600 text-xs font-semibold px-3 py-2 rounded-full shadow-sm transition flex items-center gap-1"
          aria-label="Open today's feed"
        >
          📸 Feed
          {posts.length > 0 && (
            <span className="bg-pink-500 text-white text-[10px] rounded-full px-1.5 py-0.5 ml-0.5">{posts.length}</span>
          )}
        </button>
        <button
          onClick={() => setShowBrowse(true)}
          className="bg-white/80 hover:bg-white border border-pink-200 text-pink-600 text-xs font-semibold px-3 py-2 rounded-full shadow-sm transition"
          aria-label="Browse all recipes"
        >
          🍴 Browse
        </button>
      </nav>

      {/* Auth modal for guests */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            key="auth-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md text-gray-500 hover:text-gray-800 z-10"
                aria-label="Close sign in"
              >
                ✕
              </button>
              <AuthForm onAuthSuccess={(data) => { setUser(data.user); setShowAuthModal(false); }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-right profile + notifications */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {user ? (
          <>
            <a href="/notifications" className="relative text-2xl leading-none" aria-label={`Notifications${unreadNotifs > 0 ? `, ${unreadNotifs} unread` : ""}`}>
              🔔
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </a>
            <a href="/profile" aria-label="View profile">
              <img
                src={user?.user_metadata?.avatar_url || "/rascal-fallback.png"}
                alt="Your profile"
                className="w-12 h-12 rounded-full border-2 border-pink-400 shadow-sm object-cover"
              />
            </a>
          </>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className="bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm transition"
          >
            Sign In
          </button>
        )}
      </div>

      <motion.h1
        className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        🍴 Fork My Feels
      </motion.h1>

      <motion.p
        className="text-lg sm:text-xl text-gray-700 mb-8 max-w-xl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        Tell us how you feel. We'll feed your vibe.
      </motion.p>

      {!cookingMode && !showSuggestionMessage && !showRecipeCard && (
        <>
          <MoodSelector
            recipes={recipes}
            selectedMoods={selectedMoods}
            onMoodChange={(next) => {
              setSelectedMoods(next);
              if (next.length > 0) localStorage.setItem("lastMood", next[0]);
              else localStorage.removeItem("lastMood");
            }}
            windowWidth={windowWidth}
            isMobile={isMobile}
            clickSound={clickSound}
            haptic={haptic}
          />

          {/* Prompt text when no mood selected */}
          <AnimatePresence>
            {selectedMoods.length === 0 && (
              <motion.p
                key="pick-prompt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 text-sm text-pink-400 font-medium"
              >
                Tap a mood to get started
              </motion.p>
            )}
          </AnimatePresence>

          {/* Side-by-side CTA buttons — Cook or Eat Out */}
          <div className="mt-4 flex items-center justify-center gap-3 px-4">
            <motion.button
              aria-label={selectedMoods.length > 0 ? "Get recipe suggestion to cook at home" : "Select a mood first"}
              disabled={selectedMoods.length === 0 || feedMeLoading}
              onClick={async () => {
                if (selectedMoods.length === 0 || feedMeLoading) return;
                setFeedMeLoading(true);
                try {
                  chimeSound.play();
                  haptic("medium");
                  await handleMultiMoodSubmit();
                } finally {
                  setFeedMeLoading(false);
                }
              }}
              animate={selectedMoods.length > 0 && !feedMeLoading
                ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
                : { scale: 1 }
              }
              className={`font-semibold py-3.5 px-6 rounded-full shadow-lg transition text-sm ${
                feedMeLoading
                  ? "bg-pink-400 text-white/80 cursor-wait"
                  : selectedMoods.length > 0
                    ? "bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white"
                    : "bg-gray-200 text-gray-400 cursor-default"
              }`}
              whileTap={selectedMoods.length > 0 && !feedMeLoading ? { scale: 0.95 } : {}}
            >
              {feedMeLoading ? "Finding..." : selectedMoods.length > 0 ? "Cook at Home 🍳" : "Pick a mood ↑"}
            </motion.button>

            <motion.a
              href="/eat-out"
              aria-label={selectedMoods.length > 0 ? "Find somewhere to eat out" : "Select a mood first to find places"}
              onClick={(e) => {
                if (selectedMoods.length === 0) {
                  e.preventDefault();
                  return;
                }
                haptic("medium");
                bloopSound.play();
              }}
              animate={selectedMoods.length > 0
                ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.3 } }
                : { scale: 1 }
              }
              className={`font-semibold py-3.5 px-6 rounded-full shadow-lg transition text-sm text-center ${
                selectedMoods.length > 0
                  ? "bg-purple-500 hover:bg-purple-600 active:bg-purple-700 text-white cursor-pointer"
                  : "bg-gray-200 text-gray-400 cursor-default pointer-events-none"
              }`}
              whileTap={selectedMoods.length > 0 ? { scale: 0.95 } : {}}
            >
              {selectedMoods.length > 0 ? "Eat Out 🍽️" : "Eat Out"}
            </motion.a>
          </div>
        </>
      )}

      <AnimatePresence>
        {noRecipesFound && !showRecipeCard && (
          <motion.div key="no-recipes" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center">
            <div className="text-5xl mb-3">😕</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Rascal's stumped!</h3>
            <p className="text-gray-500 text-sm mb-4">No recipes found for that vibe yet. Try a different mood or check back soon!</p>
            <button onClick={() => { setNoRecipesFound(false); setSelectedMoods([]); }} className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-full transition">
              Try another mood
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuggestionMessage && (
          <motion.div key="suggestion-msg" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.6 }} className="text-xl font-medium text-pink-600 mt-10">
            Based on your vibe... 💫
          </motion.div>
        )}
        {showPostCapture && user && (
          <motion.div key="post-capture" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.6 }}>
            <RecipePostCapture user={user} recipe={recipe} moods={selectedMoods} rating={moodRating} onComplete={() => { setShowPostCapture(false); handleReshuffle(); }} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRecipeCard && recipe && !cookingMode && (
          <RecipeCard
            recipe={recipe}
            recipeAvgRating={recipeAvgRating}
            savedIds={savedIds}
            onToggleFavourite={toggleFavourite}
            onMakeIt={handleMakeIt}
            onReshuffle={handleReshuffle}
            onShare={() => navigator.share({ title: `${recipe.emoji} ${recipe.name}`, text: `I'm making ${recipe.name} tonight — Fork My Feels matched it to my mood! 🍴`, url: window.location.href })}
            onShoppingList={() => setShowShoppingList(true)}
            haptic={haptic}
            bloopSound={bloopSound}
            submitRecipeRating={submitRecipeRating}
          />
        )}
      </AnimatePresence>

      {showShoppingList && recipe && <ShoppingListModal recipe={recipe} onClose={() => setShowShoppingList(false)} />}


      {cookingMode && recipe && (
        <CookingMode
          recipe={recipe}
          selectedMoods={selectedMoods}
          moodRating={moodRating}
          setMoodRating={setMoodRating}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          isTiming={isTiming}
          setIsTiming={setIsTiming}
          haptic={haptic}
          windowWidth={windowWidth}
          onDone={() => { setCookingMode(false); setRecipe(null); }}
          onPostCapture={() => { setCookingMode(false); setShowPostCapture(true); }}
          submitRecipeRating={submitRecipeRating}
        />
      )}

      {showFeed && (
        <FeedOverlay
          posts={posts}
          feedTab={feedTab}
          setFeedTab={setFeedTab}
          feedReactions={feedReactions}
          reactionCounts={reactionCounts}
          friendIds={friendIds}
          feedRefreshing={feedRefreshing}
          onRefresh={refreshFeed}
          onReact={reactToPost}
          onClose={() => setShowFeed(false)}
          isGuest={!user}
          onRequireAuth={() => setShowAuthModal(true)}
        />
      )}
    </div>
  );
}
