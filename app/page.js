
"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Howl } from "howler";

import AuthForm from "./components/AuthForm";
import EatOutSuggestions from "./components/EatOutSuggestion";
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

// Extracted components
import MoodSelector from "./components/MoodSelector";
import RecipeCard from "./components/RecipeCard";
import CookingMode from "./components/CookingMode";
import ShoppingListModal from "./components/ShoppingListModal";
import FeedOverlay from "./components/FeedOverlay";

export default function Home() {
  const [appLoading, setAppLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [recipes, setRecipes] = useState({});
  const [recipe, setRecipe] = useState(null);
  const [cookingMode, setCookingMode] = useState(false);
  const [showSuggestionMessage, setShowSuggestionMessage] = useState(false);
  const [showRecipeCard, setShowRecipeCard] = useState(false);
  const [user, setUser] = useState(null);
  const [eatOutMode, setEatOutMode] = useState(false);
  const [readyToShowMoods, setReadyToShowMoods] = useState(false);
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
    try {
      const raw = localStorage.getItem("fmf_saved_recipes");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr.map((r) => r.id));
    } catch {
      return new Set();
    }
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
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("recipe_posts")
      .select("*, profiles(username, avatar_url), recipes(name, emoji)")
      .gte("created_at", today)
      .order("created_at", { ascending: false });
    if (!error && data) {
      setPosts(data);
      if (data.length > 0 && user) {
        const postIds = data.map((p) => p.id);
        const { data: rxData } = await supabase
          .from("post_reactions").select("post_id, emoji").in("post_id", postIds);
        if (rxData) {
          const counts = {};
          rxData.forEach(({ post_id, emoji }) => {
            if (!counts[post_id]) counts[post_id] = {};
            counts[post_id][emoji] = (counts[post_id][emoji] || 0) + 1;
          });
          setReactionCounts(counts);
        }
        const { data: myRx } = await supabase
          .from("post_reactions").select("post_id, emoji")
          .eq("user_id", user.id).in("post_id", postIds);
        if (myRx) {
          const rxMap = {};
          myRx.forEach(({ post_id, emoji }) => { rxMap[post_id] = emoji; });
          setFeedReactions(rxMap);
        }
      }
    }
    setFeedRefreshing(false);
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
      toast("Removed from saved", { icon: "💔" });
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

    const initApp = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      setUser(currentUser);

      const today = new Date().toISOString().slice(0, 10);

      // Run independent queries in parallel
      const [postsResult, recipesResult] = await Promise.all([
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

      const postData = !postsResult.error ? (postsResult.data || []) : [];
      setPosts(postData);

      if (!recipesResult.error) {
        const formatted = {};
        recipesResult.data.forEach((recipe) => {
          const moods = typeof recipe.moods === "string"
            ? JSON.parse(recipe.moods)
            : recipe.moods;
          moods.forEach((mood) => {
            if (!formatted[mood]) formatted[mood] = [];
            formatted[mood].push(recipe);
          });
        });
        setRecipes(formatted);
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

      setTimeout(() => {
        setReadyToShowMoods(true);
        setAppLoading(false);
      }, 300);
    };

    initApp();

    listener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") setUser(session.user);
      if (event === "SIGNED_OUT") setUser(null);
    });

    return () => { listener?.subscription?.unsubscribe(); };
  }, []);

  const handleMultiMoodSubmit = async () => {
    if (selectedMoods.length === 0) return;
    if (!user?.id) return;

    const lastSuggestedId = localStorage.getItem("lastMealId");

    const { data: userRatings, error: userError } = await supabase
      .from("recipe_ratings")
      .select("recipe_id, rating, mood")
      .eq("user_id", user.id)
      .in("mood", selectedMoods);

    const { data: globalRatings, error: globalError } = await supabase
      .from("recipe_ratings")
      .select("recipe_id, rating, mood")
      .in("mood", selectedMoods);

    if (userError || globalError) {
      toast.error("Error fetching ratings.");
      return;
    }

    const allMatchingRecipes = selectedMoods.flatMap((mood) => recipes[mood] || []);
    const uniqueRecipes = Array.from(new Map(
      allMatchingRecipes.map((recipe) => [recipe.id, recipe])
    ).values());

    if (uniqueRecipes.length === 0) {
      setNoRecipesFound(true);
      return;
    }

    setNoRecipesFound(false);

    const cookHistoryRaw = localStorage.getItem("fmf_cook_history");
    const cookHistory = cookHistoryRaw ? JSON.parse(cookHistoryRaw) : [];

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
    try {
      const raw = localStorage.getItem("fmf_cook_history");
      const history = raw ? JSON.parse(raw) : [];
      const entry = { id: recipe.id, name: recipe.name, emoji: recipe.emoji, cookedAt: new Date().toISOString() };
      const deduped = [entry, ...history.filter((h) => h.id !== recipe.id)].slice(0, 20);
      localStorage.setItem("fmf_cook_history", JSON.stringify(deduped));
    } catch {}
  };

  const [showAuthModal, setShowAuthModal] = useState(false);

  // Guest-friendly: prompt sign-in instead of blocking
  const requireAuth = (action) => {
    if (user) return true;
    setShowAuthModal(true);
    return false;
  };

  // Loading skeleton
  if (appLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-48 h-8 bg-pink-200 rounded-full animate-pulse mb-4" />
        <div className="w-64 h-4 bg-pink-100 rounded-full animate-pulse mb-12" />
        <div className="relative w-72 h-72 flex items-center justify-center">
          <div className="w-36 h-36 rounded-full bg-pink-200 animate-pulse" />
          {[...Array(6)].map((_, i) => {
            const angle = (360 / 6) * i;
            const x = 120 * Math.cos((angle * Math.PI) / 180);
            const y = 120 * Math.sin((angle * Math.PI) / 180);
            return (
              <div
                key={i}
                className="absolute w-20 h-10 bg-white rounded-full animate-pulse opacity-60"
                style={{ left: `calc(50% + ${x}px - 40px)`, top: `calc(50% + ${y}px - 20px)` }}
              />
            );
          })}
        </div>
        <div className="mt-12 w-36 h-14 bg-pink-300 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-4 py-12 text-center font-sans overflow-x-hidden">
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
      <nav className="absolute top-4 left-4 flex items-center gap-2 flex-wrap max-w-[60vw]" aria-label="Main navigation">
        <button onClick={() => { if (requireAuth()) setShowSaved(true); }} className="text-2xl leading-none" aria-label="Open saved recipes">❤️</button>
        <button
          onClick={() => { if (requireAuth()) setShowFeed(true); }}
          className="flex items-center gap-1 bg-white/80 hover:bg-white border border-pink-200 text-pink-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition"
          aria-label="Open today's feed"
        >
          📸 Feed
          {posts.length > 0 && (
            <span className="bg-pink-500 text-white text-[10px] rounded-full px-1.5 py-0.5 ml-1">{posts.length}</span>
          )}
        </button>
        <button
          onClick={() => setShowBrowse(true)}
          className="flex items-center gap-1 bg-white/80 hover:bg-white border border-pink-200 text-pink-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition"
          aria-label="Browse all recipes"
        >
          🍴 Browse
        </button>
        <a href="/leaderboard" className="flex items-center gap-1 bg-white/80 hover:bg-white border border-amber-200 text-amber-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition" aria-label="View leaderboard">🏆</a>
        <a href="/insights" className="flex items-center gap-1 bg-white/80 hover:bg-white border border-purple-200 text-purple-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition" aria-label="View my insights">📊</a>
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

      {readyToShowMoods && !cookingMode && !showSuggestionMessage && !showRecipeCard && (
        <>
          <motion.button
            onClick={() => {
              bloopSound.play();
              const turningOn = !eatOutMode;
              setEatOutMode(turningOn);
              if (turningOn && "geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(() => {}, () => {});
              }
            }}
            whileTap={{ scale: 0.97 }}
            className="mb-8 bg-purple-200 hover:bg-purple-300 text-purple-800 font-semibold py-4 px-8 rounded-full shadow-sm transition"
          >
            {eatOutMode ? "Back to Mood Recipes" : "I'm Eating Out 🍽️"}
          </motion.button>

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

          {/* Wrapper handles fixed positioning; button animates scale inside it */}
          <div className="fixed bottom-6 left-0 right-0 z-30 flex justify-center sm:static sm:mt-12">
            <motion.button
              aria-label={selectedMoods.length > 0 ? "Get recipe suggestion" : "Select a mood first"}
              disabled={selectedMoods.length === 0}
              onClick={async () => {
                if (selectedMoods.length === 0) return;
                if (!requireAuth()) return;
                chimeSound.play();
                haptic("medium");
                await handleMultiMoodSubmit();
              }}
              animate={selectedMoods.length > 0
                ? { scale: [1, 1.04, 1], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
                : { scale: 1 }
              }
              className={`font-semibold py-5 px-14 rounded-full shadow-xl transition ${
                selectedMoods.length > 0
                  ? "bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white"
                  : "bg-pink-200 text-pink-400 cursor-default"
              }`}
              whileTap={selectedMoods.length > 0 ? { scale: 0.97 } : {}}
            >
              {selectedMoods.length > 0 ? "Feed Me 🍴" : "Pick a mood ↑"}
            </motion.button>
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

      {eatOutMode && <EatOutSuggestions selectedMoods={selectedMoods} />}

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
        />
      )}
    </div>
  );
}
