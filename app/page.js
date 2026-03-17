




"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { Howl } from "howler";

import AuthForm from "./components/AuthForm";
import EatOutSuggestions from "./components/EatOutSuggestion";
import RecipePostCapture from "./components/RecipePostCapture";
import { supabase } from "../lib/supabaseClient";
import { getMealSuggestions } from "../utils/mealSuggestionEngine";

import Confetti from "react-confetti";
import { useWindowSize } from "@uidotdev/usehooks";
import { mergeImages } from "../lib/mergeImages";
import RascalSpaceGlide from "./components/RascalSpaceGlide";
import Onboarding from "./components/Onboarding";
import SavedRecipes from "./components/SavedRecipes";
import NotificationPrompt from "./components/NotificationPrompt";
import TodayFeedModal from "./components/TodayFeedModal";
import RecipeBrowse from "./components/RecipeBrowse";
import UsernamePrompt from "./components/UsernamePrompt";
import toast from "react-hot-toast";



const moodEmojis = {
  tired: "😴",
  happy: "😊",
  sad: "😢",
  rushed: "⏰",
  "date-night": "💘",
  chill: "🧊",
  recovering: "🛌",
  bored: "😐",
  nostalgic: "🕰️",
  overwhelmed: "😵‍💫",
};



function MoodTooltip({ label, children }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(true)}
      onTouchEnd={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute bottom-full mb-1 px-2 py-1 text-xs rounded bg-black text-white shadow z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </div>
  );
}

// const rascalVideos = {
//   sad: "/videos/rascal-sad.mp4",
//   tired: "/videos/rascal-tired.mp4",
//   default: "/rascal-fallback.png", // fallback image
// };
// const currentMood = selectedMoods[0] || "default";


export default function Home() {
  const [appLoading, setAppLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [recipes, setRecipes] = useState({});
  const [recipe, setRecipe] = useState(null);
  const [cookingMode, setCookingMode] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [showSuggestionMessage, setShowSuggestionMessage] = useState(false);
  const [showRecipeCard, setShowRecipeCard] = useState(false);
  const [user, setUser] = useState(null);
  const [eatOutMode, setEatOutMode] = useState(false);
  const [readyToShowMoods, setReadyToShowMoods] = useState(false);
  const { width: windowWidth } = useWindowSize();
  const isMobile = (windowWidth || 0) < 768;
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [moodRating, setMoodRating] = useState(0);
  const [showPostCapture, setShowPostCapture]= useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [posts, setPosts] = useState([]);
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [debugMessage, setDebugMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(null);
  const [isTiming, setIsTiming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [noRecipesFound, setNoRecipesFound] = useState(false);
  const [recipeAvgRating, setRecipeAvgRating] = useState(null);
  const [showBrowse, setShowBrowse] = useState(false);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [feedReactions, setFeedReactions] = useState({}); // postId -> emoji string
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [friendIds, setFriendIds] = useState(new Set());
  const [reactionCounts, setReactionCounts] = useState({}); // postId -> { emoji: count }
  const [feedTab, setFeedTab] = useState("all"); // "all" | "friends"
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [savedIds, setSavedIds] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = localStorage.getItem("fmf_saved_recipes");
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(arr.map((r) => r.id));
    } catch { return new Set(); }
  });








  // Swipe motion values for recipe card
  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-160, 160], [-10, 10]);
  const swipeLeftOpacity = useTransform(dragX, [-160, -20], [1, 0]);
  const swipeRightOpacity = useTransform(dragX, [20, 160], [0, 1]);

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
    setActiveStepIndex(0);
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
      console.error("❌ Failed to save rating:", error.message);
    } else {
      console.log("✅ Rating saved:", ratingValue);
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

    // Optimistic UI update
    const nextReactions = isRemoving
      ? Object.fromEntries(Object.entries(feedReactions).filter(([k]) => k !== String(postId)))
      : { ...feedReactions, [postId]: emoji };
    setFeedReactions(nextReactions);
    localStorage.setItem("fmf_feed_reactions", JSON.stringify(nextReactions));

    // Update counts optimistically
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
      // Notify post author
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
    // Sync to Supabase
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


  useEffect(() => {
    if (isTiming && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isTiming && timeLeft === 0) {
      setIsTiming(false);
      localStorage.removeItem("fmf_timer_end");
      // Tell SW to cancel any pending notifications
      navigator.serviceWorker?.controller?.postMessage({ type: "TIMER_CLEAR" });
      new Howl({ src: ["/sounds/chime.mp3"], volume: 0.5 }).play();
      haptic("success");
    }
  }, [timeLeft, isTiming]);

  // Resync timer when user returns to the app after leaving
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
  

  useEffect(() => {
    let listener;
  
    const initApp = async () => {
      // 1. Get session safely
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      setUser(currentUser);
  
      // 2. Load today's posts (join author profiles + recipe name)
      const today = new Date().toISOString().slice(0, 10);
      const { data: postData, error: postError } = await supabase
        .from("recipe_posts")
        .select("*, profiles(username, avatar_url), recipes(name, emoji)")
        .gte("created_at", today)
        .order("created_at", { ascending: false });

      if (!postError) {
        setPosts(postData || []);
      }
  
      // 3. Load approved recipes and group by moods
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .eq("status", "approved");
  
      if (!recipeError) {
        const formatted = {};
        recipeData.forEach((recipe) => {
          const moods = typeof recipe.moods === "string"
            ? JSON.parse(recipe.moods)
            : recipe.moods;
  
          moods.forEach((mood) => {
            if (!formatted[mood]) {
              formatted[mood] = [];
            }
            formatted[mood].push(recipe);
          });
        });
        setRecipes(formatted);
      }
  
      // 4. Restore last selected mood
      const lastMood = localStorage.getItem("lastMood");
      if (lastMood) setSelectedMoods([lastMood]);

      // 5. Show onboarding for first-time users
      if (!localStorage.getItem("fmf_onboarded")) {
        setShowOnboarding(true);
      }

      // 6. Prompt for username if new user has none set
      if (currentUser && !localStorage.getItem("fmf_username_set")) {
        const { data: prof } = await supabase.from("profiles").select("username").eq("id", currentUser.id).single();
        if (!prof?.username) setShowUsernamePrompt(true);
        else localStorage.setItem("fmf_username_set", "1");
      }

      if (currentUser) {
        // 7. Load friend IDs
        const { data: friendData } = await supabase
          .from("friends")
          .select("user_id, friend_id")
          .eq("status", "accepted")
          .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`);
        if (friendData) {
          setFriendIds(new Set(friendData.map((f) =>
            f.user_id === currentUser.id ? f.friend_id : f.user_id
          )));
        }

        // 8. Load reactions from Supabase (overrides localStorage)
        if (postData?.length > 0) {
          const postIds = postData.map((p) => p.id);
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
            .eq("user_id", currentUser.id).in("post_id", postIds);
          if (myRx) {
            const rxMap = {};
            myRx.forEach(({ post_id, emoji }) => { rxMap[post_id] = emoji; });
            setFeedReactions(rxMap);
            localStorage.setItem("fmf_feed_reactions", JSON.stringify(rxMap));
          }
        }

        // 9. Load saved recipes from Supabase
        const { data: savedData } = await supabase
          .from("saved_recipes")
          .select("recipe_id, recipes(id, name, emoji, description)")
          .eq("user_id", currentUser.id);
        if (savedData?.length > 0) {
          const savedArr = savedData.map((s) => s.recipes).filter(Boolean);
          localStorage.setItem("fmf_saved_recipes", JSON.stringify(savedArr));
          setSavedIds(new Set(savedArr.map((r) => r.id)));
        }

        // 10. Load unread notification count
        const { count: notifCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUser.id)
          .eq("read", false);
        if (notifCount) setUnreadNotifs(notifCount);
      }

      // Restore feed reactions from localStorage as fallback
      try {
        const raw = localStorage.getItem("fmf_feed_reactions");
        if (raw && !feedReactions) setFeedReactions(JSON.parse(raw));
      } catch {}

      // 11. Animate mood buttons after a short delay
      setTimeout(() => {
        setReadyToShowMoods(true);
        setAppLoading(false);
      }, 300);
    };
  
    initApp();
  
    // 5. Auth state change listener
    listener = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") setUser(session.user);
      if (event === "SIGNED_OUT") setUser(null);
    });
  
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);
  
  function extractMinutes(stepText) {
    const match = stepText.match(/(\d+)\s*(min|minutes?)/i);
    return match ? parseInt(match[1]) : null;
  }

  
  


  const handleMultiMoodSubmit = async () => {
    if (selectedMoods.length === 0) {
      setDebugMessage("⚠️ No moods selected.");
      return;
    }
  
    setDebugMessage("⏳ Fetching ratings...");
  
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
      setDebugMessage("❌ Error fetching ratings.");
      return;
    }
  
    const allMatchingRecipes = selectedMoods.flatMap((mood) => recipes[mood] || []);
    const uniqueRecipes = Array.from(new Map(
      allMatchingRecipes.map((recipe) => [recipe.id, recipe])
    ).values());

    if (uniqueRecipes.length === 0) {
      setNoRecipesFound(true);
      setDebugMessage("");
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
      setDebugMessage("");
      return;
    }

    // Compute average rating for the suggested recipe
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
    setDebugMessage(`✅ Suggested: ${suggestion.name}`);
  
    setTimeout(() => {
      setShowSuggestionMessage(false);
      setShowRecipeCard(true);
      setDebugMessage(""); // Clear message after showing
    }, 2000);
  };
  

  const handleReshuffle = () => {
    setRecipe(null);
    setShowRecipeCard(false);
    setShowSuggestionMessage(false);
    setCookingMode(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-100 to-orange-100">
        <AuthForm onAuthSuccess={(data) => setUser(data.user)} />
      </div>
    );
  }

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
          onDone={(username) => {
            setShowUsernamePrompt(false);
            localStorage.setItem("fmf_username_set", "1");
          }}
        />
      )}
      <AnimatePresence>{showSaved && <SavedRecipes onClose={() => setShowSaved(false)} />}</AnimatePresence>
      <AnimatePresence>{showBrowse && <RecipeBrowse onClose={() => setShowBrowse(false)} />}</AnimatePresence>
      {showRecipeCard && <NotificationPrompt />}

      <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap max-w-[60vw]">
        <button
          onClick={() => setShowSaved(true)}
          className="text-2xl leading-none"
          title="Saved recipes"
        >
          ❤️
        </button>
        <button
          onClick={() => setShowFeed(true)}
          className="flex items-center gap-1 bg-white/80 hover:bg-white border border-pink-200 text-pink-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition"
          title="Today's Feed"
        >
          📸 Feed
          {posts.length > 0 && (
            <span className="bg-pink-500 text-white text-[10px] rounded-full px-1.5 py-0.5 ml-1">{posts.length}</span>
          )}
        </button>
        <button
          onClick={() => setShowBrowse(true)}
          className="flex items-center gap-1 bg-white/80 hover:bg-white border border-pink-200 text-pink-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition"
          title="Browse all recipes"
        >
          🍴 Browse
        </button>
        <a
          href="/leaderboard"
          className="flex items-center gap-1 bg-white/80 hover:bg-white border border-amber-200 text-amber-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition"
          title="Leaderboard"
        >
          🏆
        </a>
        <a
          href="/insights"
          className="flex items-center gap-1 bg-white/80 hover:bg-white border border-purple-200 text-purple-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm transition"
          title="My Insights"
        >
          📊
        </a>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {/* Notification Bell */}
        <a href="/notifications" className="relative text-2xl leading-none" title="Notifications">
          🔔
          {unreadNotifs > 0 && (
            <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadNotifs > 9 ? "9+" : unreadNotifs}
            </span>
          )}
        </a>
        <button onClick={() => window.location.href = "/profile"}>
          <img
            src={user?.user_metadata?.avatar_url || "/rascal-fallback.png"}
            alt="Profile"
            className="w-12 h-12 rounded-full border-2 border-pink-400 shadow-sm object-cover"
          />
        </button>
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
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    console.log("📍 Location:", position.coords.latitude, position.coords.longitude);
                    // You can optionally store the coords in state here if needed
                  },
                  (error) => {
                    console.warn("⚠️ Location error:", error.message);
                  }
                );
              }
            }}
            whileTap={{ scale: 0.97 }}
            className="mb-8 bg-purple-200 hover:bg-purple-300 text-purple-800 font-semibold py-4 px-8 rounded-full shadow-sm transition"
          >
            {eatOutMode ? "Back to Mood Recipes" : "I'm Eating Out 🍽️"}
          </motion.button>


          {(() => {
            const containerSize = Math.min((windowWidth || 390) - 32, 460);
            // btnWidth must stay below radius × 0.618 (the chord between adjacent
            // buttons at 36° spacing) to prevent top/bottom neighbours from clipping.
            // Solving the constraint gives max ~0.227 × containerSize; use 0.22 with
            // a floor of 70 so tiny phones still have tappable buttons.
            const btnWidth = isMobile ? Math.max(containerSize * 0.22, 70) : 120;
            const btnHeight = isMobile ? 52 : 62;
            // Clamp radius so buttons never overflow container bounds
            const maxRadius = containerSize / 2 - btnWidth / 2 - 6;
            const radius = Math.min(containerSize * 0.44, maxRadius);
            return (
          <div
            className="relative mx-auto"
            style={{ width: containerSize, height: containerSize }}
          >
            {/* Mood Buttons in orbit — anchor at exact container center */}
            <motion.div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 0,
                height: 0,
              }}
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: { staggerChildren: 0.04, delayChildren: 0.5 },
                },
              }}
            >
              {Object.keys(recipes)
                  .filter((moodKey) => moodKey !== "default")
                  .map((moodKey, i, arr) => {
                    const total = arr.length;
                    // Start at -90° (top) so single buttons land at top/bottom
                    // instead of pairs, eliminating overlap
                    const angle = (360 / total) * i - 90;
                    const x = radius * Math.cos((angle * Math.PI) / 180);
                    const y = radius * Math.sin((angle * Math.PI) / 180);

                    return (
                      <motion.button
                        key={moodKey}
                        style={{
                          position: "absolute",
                          left: x - btnWidth / 2,
                          top: y - btnHeight / 2,
                          width: btnWidth,
                          height: btnHeight,
                          borderRadius: "999px",
                        }}
                        variants={{
                          hidden: { opacity: 0, scale: 0.8, originX: "50%", originY: "50%" },
                          visible: { opacity: 1, scale: 1, originX: "50%", originY: "50%" },
                        }}
                        onClick={() => {
                          clickSound.play();
                          haptic("light");
                          const next = selectedMoods[0] === moodKey ? [] : [moodKey];
                          setSelectedMoods(next);
                          if (next.length > 0) localStorage.setItem("lastMood", next[0]);
                          else localStorage.removeItem("lastMood");

                        }}
                        whileTap={{ scale: 0.95 }}
                        className={`shadow-md ${isMobile ? "px-1 py-1" : "px-4 py-2"} text-base rounded-full border transition ${
                          selectedMoods.includes(moodKey)
                            ? "bg-pink-200 border-pink-400"
                            : "bg-white border-gray-300 hover:bg-pink-100"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span style={{ fontSize: isMobile ? "1.2rem" : "1.5rem" }}>
                            {moodEmojis[moodKey] || "🍽️"}
                          </span>
                          <span className={`${isMobile ? "text-[10px]" : "text-sm"} font-medium capitalize truncate w-full text-center block`}>
                            {moodKey.replace("-", " ")}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}

                                  
              
            </motion.div>

            {/* Rascal reacts to mood */}
            {/* {(() => {
              const rascalVideos = {
                sad: "/videos/rascal-sad.mp4",
                tired: "/videos/rascal-tired.mp4",
                default: "/videos/rascal-idle.mp4",
              };

              const currentMood = selectedMoods[0] || "default";
              // const isVideo = rascalVideos[currentMood]?.endsWith(".mp4");
              // const currentMood = selectedMoods[0];
              const videoSrc = rascalVideos[currentMood];
              const isVideo = Boolean(videoSrc);


              const wrapperStyle = {
                width: isMobile ? "200px" : "250px",
                height: isMobile ? "200px" : "250px",
                left: isMobile ? "38%" : "50%",
                top: isMobile ? "45%" : "50%",
                transform: "translate(-50%, -50%)",
              };

              return (
                <div
                  className="absolute z-20 rounded-full border-2 border-pink-300 shadow-lg bg-white overflow-hidden"
                  style={wrapperStyle}
                >
                  {isVideo ? (
                    <video
                      key={currentMood}
                      src={rascalVideos[currentMood]}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      key="fallback"
                      src={rascalVideos.default}
                      alt="Rascal Mascot"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              );
            })()}
 */}
              {(() => {
                const rascalVideos = {
                  sad: "/videos/rascal-sad.mp4",
                  tired: "/videos/rascal-tired.mp4",
                  chill: "/videos/rascal-chill.mp4",
                  rushed: "/videos/rascal-rushed.mp4",
                  happy: "/videos/rascal-happy1.mp4",
                  overwhelmed: "/videos/rascal-overwhelmed.mp4",
                  nostalgic: "/videos/rascal-nostalgic.mp4",
                  "date-night": "/videos/rascal-date-night.mp4",
                  hangover: "/videos/rascal-recovering.mp4",
                  bored: "/videos/rascal-bored.mp4",

                  // add more as needed
                };

                const currentMood = selectedMoods[0];
                const videoSrc = rascalVideos[currentMood] || "/videos/rascal-idle.mp4";

                const rascalSize = Math.min(containerSize * 0.46, 250);
                const wrapperStyle = {
                  width: rascalSize,
                  height: rascalSize,
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                };

                return (
                  <div
                    className="absolute z-20 rounded-full border-2 border-pink-300 shadow-lg bg-white overflow-hidden"
                    style={wrapperStyle}
                  >
                    <AnimatePresence mode="wait">
                      <motion.video
                        key={videoSrc}
                        src={videoSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>
                  </div>
                );
              })()}


          </div>
          );
          })()}


          <motion.button
            onClick={async () => {
              if (selectedMoods.length === 0) return;
              chimeSound.play();
              haptic("medium");
              await handleMultiMoodSubmit();
            }}
            animate={selectedMoods.length > 0
              ? { scale: [1, 1.04, 1], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
              : { scale: 1 }
            }
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-30 sm:static sm:mt-12 sm:translate-x-0 sm:left-auto sm:bottom-auto font-semibold py-5 px-14 rounded-full shadow-xl transition ${
              selectedMoods.length > 0
                ? "bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white"
                : "bg-pink-200 text-pink-400 cursor-default"
            }`}
            whileTap={selectedMoods.length > 0 ? { scale: 0.97 } : {}}
          >
            {selectedMoods.length > 0 ? "Feed Me 🍴" : "Pick a mood ↑"}
          </motion.button>
        </>
      )}

      <AnimatePresence>
        {noRecipesFound && !showRecipeCard && (
          <motion.div
            key="no-recipes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 text-center"
          >
            <div className="text-5xl mb-3">😕</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Rascal's stumped!</h3>
            <p className="text-gray-500 text-sm mb-4">No recipes found for that vibe yet. Try a different mood or check back soon!</p>
            <button
              onClick={() => { setNoRecipesFound(false); setSelectedMoods([]); }}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-6 rounded-full transition"
            >
              Try another mood
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuggestionMessage && (
          <motion.div
            key="suggestion-msg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
            className="text-xl font-medium text-pink-600 mt-10"
          >
            Based on your vibe... 💫
          </motion.div>
        )}

        {showPostCapture && user &&(
          <motion.div
            key="post-capture"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6 }}
          >
            <RecipePostCapture
              user={user}
              recipe={recipe}
              moods={selectedMoods}
              rating={moodRating}
              onComplete={() => {
                setShowPostCapture(false);
                handleReshuffle();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>



      <AnimatePresence>
        {showRecipeCard && recipe && !cookingMode && (
          <div className="relative mt-8 w-full max-w-md">
            {/* Swipe hints */}
            <motion.div
              style={{ opacity: swipeLeftOpacity }}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 pointer-events-none z-10 flex flex-col items-center gap-1"
            >
              <span className="text-2xl">🔄</span>
              <span>Reshuffle</span>
            </motion.div>
            <motion.div
              style={{ opacity: swipeRightOpacity }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-pink-400 pointer-events-none z-10 flex flex-col items-center gap-1"
            >
              <span className="text-2xl">❤️</span>
              <span>Save</span>
            </motion.div>

            <motion.div
              key="recipe-card"
              style={{ rotate: cardRotate }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDrag={(_, info) => dragX.set(info.offset.x)}
              onDragEnd={(_, info) => {
                dragX.set(0);
                if (info.offset.x > 100) {
                  haptic("success");
                  toggleFavourite(recipe);
                } else if (info.offset.x < -100) {
                  haptic("light");
                  bloopSound.play();
                  handleReshuffle();
                }
              }}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl p-6 cursor-grab active:cursor-grabbing select-none"
            >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                {recipe.emoji} {recipe.name}
              </h2>
              <button
                onClick={() => { haptic("success"); toggleFavourite(recipe); }}
                className="text-2xl shrink-0 transition-transform active:scale-125"
                title={savedIds.has(recipe.id) ? "Remove from saved" : "Save recipe"}
              >
                {savedIds.has(recipe.id) ? "❤️" : "🤍"}
              </button>
            </div>
            <p className="text-gray-700 mb-2">{recipe.description}</p>
            {recipeAvgRating !== null && (
              <p className="text-sm text-amber-500 mb-4">
                {"⭐".repeat(Math.round(recipeAvgRating))} {recipeAvgRating.toFixed(1)} / 5
              </p>
            )}
            {recipe.ingredients && (
              <div className="text-left text-gray-800 mb-4">
                <h3 className="font-semibold mb-1">🧂 Ingredients</h3>
                <ul className="list-disc list-inside">
                {(
                  Array.isArray(recipe.ingredients)
                    ? recipe.ingredients
                    : JSON.parse(recipe.ingredients || "[]")
                ).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}

                </ul>
              </div>
            )}


            {recipe.steps && (
              <motion.button
                onClick={() => {
                  setCookingMode(true);
                  setActiveStepIndex(0);
                  // Save to cook history
                  try {
                    const raw = localStorage.getItem("fmf_cook_history");
                    const history = raw ? JSON.parse(raw) : [];
                    const entry = { id: recipe.id, name: recipe.name, emoji: recipe.emoji, cookedAt: new Date().toISOString() };
                    const deduped = [entry, ...history.filter((h) => h.id !== recipe.id)].slice(0, 20);
                    localStorage.setItem("fmf_cook_history", JSON.stringify(deduped));
                  } catch {}
                }}
                whileTap={{ scale: 0.96 }}
                className="mt-4 bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl shadow-sm transition"
              >
                Let’s Make It →
              </motion.button>
            )}

            <motion.button
              onClick={() => {
                bloopSound.play();
                handleReshuffle();
                setMoodRating(0); // or the selected star value
                submitRecipeRating(0);

              }}
              whileTap={{ scale: 0.96 }}
              className="mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl transition"
            >
              I’m not feeling it
            </motion.button>

            {typeof navigator !== "undefined" && navigator.share && (
              <motion.button
                onClick={() => navigator.share({
                  title: `${recipe.emoji} ${recipe.name}`,
                  text: `I'm making ${recipe.name} tonight — Fork My Feels matched it to my mood! 🍴`,
                  url: window.location.href,
                })}
                whileTap={{ scale: 0.96 }}
                className="mt-3 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded-xl transition"
              >
                📤 Share Recipe
              </motion.button>
            )}

            <motion.button
              onClick={() => setShowShoppingList(true)}
              whileTap={{ scale: 0.96 }}
              className="mt-3 bg-green-100 hover:bg-green-200 text-green-800 font-medium py-2 px-4 rounded-xl transition"
            >
              🛒 Let’s Go Shopping
            </motion.button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {showShoppingList && recipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative">
            <button
              onClick={() => setShowShoppingList(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
            >
              ✕
            </button>
            <h2 className="text-2xl font-semibold mb-4 text-center">🛍️ Shopping List</h2>
            <ul className="list-disc list-inside text-left space-y-1 text-gray-800">
            {(
              Array.isArray(recipe.ingredients)
                ? recipe.ingredients
                : JSON.parse(recipe.ingredients || "[]")
            ).map((item, index) => (
              <li key={index}>{item}</li>
            ))}


            </ul>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  const list = (
                    Array.isArray(recipe.ingredients)
                      ? recipe.ingredients
                      : JSON.parse(recipe.ingredients || "[]")
                  ).join("\n");

                  navigator.clipboard.writeText(list).then(() => {
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 2000);
                  });
                }}
                className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition"
              >
                📋 Copy to Clipboard
              </button>

              <a
                href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                  (
                    Array.isArray(recipe.ingredients)
                      ? recipe.ingredients
                      : JSON.parse(recipe.ingredients || "[]")
                  ).join("\n")
                )}`}
                download={`shopping-list-${recipe.name.replace(/\s+/g, "-").toLowerCase()}.txt`}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-xl transition text-center"
              >
                💾 Save to Notes
              </a>
              {copySuccess && (
                <p className="text-green-600 mt-2 text-sm text-center">
                  ✅ Copied to clipboard!
                </p>
              )}

            </div>

          </div>
        </div>
      )}


      {eatOutMode && <EatOutSuggestions selectedMoods={selectedMoods} />}

      

      {cookingMode && (() => {
        let stepsArray = [];
        try {
          stepsArray = Array.isArray(recipe.steps)
            ? recipe.steps
            : JSON.parse(recipe.steps || "[]");
        } catch (err) {
          console.error("❌ Failed to parse steps", err);
        }

        return (
          <div className="mt-6 bg-white p-6 rounded-2xl shadow-xl max-w-4xl w-full">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-6">
              {/* Left side: Mood info */}
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm text-gray-500">You’re feeling...</p>
                <h2 className="text-2xl font-bold mt-1 capitalize">
                  {moodEmojis[selectedMoods[0]]} {selectedMoods[0]}
                </h2>
                <p className="text-md mt-2 text-gray-600 italic">
                  Let’s cook something to match your vibe.
                </p>
              </div>

              {/* Right side: Rascal animation */}
              <div className="flex-1 flex justify-center">
                <video
                  src="/videos/rascal-cooking.mp4"
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="w-48 h-48 md:w-60 md:h-60 rounded-full shadow-lg object-cover"
                />
              </div>
            </div>

            {/* Recipe Step Display */}
            <h3 className="text-xl font-semibold mb-2">
              Step {activeStepIndex + 1} of {stepsArray.length}
            </h3>
            <p className="text-gray-800 mb-4">{stepsArray[activeStepIndex]}</p>
            {(() => {
              const minutes = extractMinutes(stepsArray[activeStepIndex]);

              if (minutes && !isTiming && timeLeft === null) {
                return (
                  <button
                    onClick={() => {
                      const secs = minutes * 60;
                      const endTime = Date.now() + secs * 1000;
                      setTimeLeft(secs);
                      setIsTiming(true);
                      localStorage.setItem("fmf_timer_end", endTime.toString());
                      haptic("medium");
                      // Fire notification via SW even if user leaves the app
                      navigator.serviceWorker?.controller?.postMessage({
                        type: "TIMER_SET",
                        endTime,
                        recipeName: recipe?.name,
                        minutes,
                      });
                    }}
                    className="mt-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-xl"
                  >
                    ⏱️ Start {minutes}-Minute Timer
                  </button>
                );
              } else if (isTiming && timeLeft > 0) {
                return (
                  <>
                    <p className="mt-4 text-lg text-pink-600 font-bold">
                      ⏳ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} left...
                    </p>
                    {timeLeft > 0 && isTiming && (
                      <div className="my-6">
                        <RascalSpaceGlide
                          secondsRemaining={timeLeft}
                          onTimeUp={() => {
                            setTimeLeft(0);
                            setIsTiming(false);
                            setActiveStepIndex((i) => Math.min(i + 1, stepsArray.length - 1));
                          }}
                        />
                      </div>
                    )}
                  </>
                );
                
              } else if (isTiming && timeLeft === 0) {
                return (
                  <p className="mt-4 text-green-600 font-semibold">
                    ✅ Time’s up! Let’s keep going.
                  </p>
                );
              }
              return null;
            })()}


            <div className="flex justify-between items-center">
              <button
                onClick={() => setActiveStepIndex((i) => Math.max(0, i - 1))}
                disabled={activeStepIndex === 0}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30"
              >
                ← Back
              </button>

              {activeStepIndex < stepsArray.length - 1 ? (
                <button
                  onClick={() => {
                    haptic("light");
                    setActiveStepIndex((i) => Math.min(stepsArray.length - 1, i + 1));
                  }}
                  className="text-sm text-pink-500 hover:text-pink-700"
                >
                  Next →
                </button>
              ) : (
                <button
                onClick={() => {
                  setShowCelebration(true);
                  setTimeout(() => setShowRatingModal(true), 1500); // show modal after confetti
                }}
                >
                  Done ✓
                </button>
              )}
            </div>

            {showRatingModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-sm relative text-center">
                  <button
                    onClick={() => setShowRatingModal(false)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl"
                  >
                    ✕
                  </button>
                  <h2 className="text-xl font-semibold mb-2">⭐ Rate This Recipe</h2>
                  <p className="text-gray-600 mb-4">How well did it match your mood?</p>

                  {showCelebration && (
                    <div className="fixed inset-0 z-[9999] pointer-events-none">
                      <Confetti
                        width={windowWidth || 390}
                        height={window.innerHeight}
                        numberOfPieces={300}
                        recycle={false}
                      />
                    </div>
                  )}

                  <div className="flex justify-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setMoodRating(star)}
                        className={`text-2xl ${
                          star <= moodRating ? "text-yellow-400" : "text-gray-300"
                        } hover:text-yellow-500 transition`}
                      >
                        ★
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => {
                        setShowRatingModal(false);
                        setCookingMode(false);
                        setActiveStepIndex(0);
                        setRecipe(null);
                      }}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-xl transition"
                    >
                      😐 Not Feeling It
                    </button>
                    <button
                      onClick={() => {
                        setMoodRating(moodRating);
                        setCookingMode(false);
                        setActiveStepIndex(0);
                        setShowRatingModal(false);
                        submitRecipeRating(moodRating);
                        setShowPostCapture(true);
                      }}
                      className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl transition"
                    >
                      ✅ Submit
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

    {showFeed && (
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 120 }}
        className="fixed inset-0 bg-white z-50 overflow-y-auto px-4 pt-6 pb-16"
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">📸 Today’s Forks</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshFeed}
              disabled={feedRefreshing}
              className="text-xs text-pink-500 hover:text-pink-700 font-semibold disabled:opacity-50"
            >
              {feedRefreshing ? "↻ Loading…" : "↻ Refresh"}
            </button>
            <button
              onClick={() => setShowFeed(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* All / Friends tab toggle */}
        <div className="flex gap-2 mb-4">
          {[{ key: "all", label: "🌍 All" }, { key: "friends", label: "👥 Friends" }].map((t) => (
            <button
              key={t.key}
              onClick={() => setFeedTab(t.key)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                feedTab === t.key ? "bg-pink-500 text-white shadow" : "bg-white text-gray-600 border border-pink-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {(() => {
          const visiblePosts = feedTab === "friends"
            ? posts.filter((p) => friendIds.has(p.user_id))
            : posts;
          return visiblePosts.length === 0 ? (
            <div className="text-center mt-16">
              <div className="text-5xl mb-3">{feedTab === "friends" ? "👥" : "📭"}</div>
              <p className="text-gray-500 font-medium">
                {feedTab === "friends" ? "No friend posts yet today!" : "No posts yet today!"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {feedTab === "friends"
                  ? "Your friends haven’t cooked yet — or add some friends first 🤝"
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
                  <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Author row */}
                    <div className="flex items-center gap-2 px-4 pt-3 pb-2">
                      <a href={`/user/${post.user_id}`}>
                        <img
                          src={author?.avatar_url || "/rascal-fallback.png"}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover border border-pink-200"
                        />
                      </a>
                      <div>
                        <a href={`/user/${post.user_id}`} className="text-sm font-semibold text-gray-800 hover:text-pink-600 transition">
                          {author?.username ? `@${author.username}` : "Anonymous Chef"}
                        </a>
                        <p className="text-xs text-gray-400">
                          {new Date(post.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    {/* Photo */}
                    {post.photo_url && (
                      <img src={post.photo_url} alt="Post" className="w-full object-cover max-h-72" />
                    )}
                    {/* Meta + reactions */}
                    <div className="px-4 py-3">
                      {post.recipes && (
                        <p className="font-semibold text-gray-900 mb-1">{post.recipes.emoji} {post.recipes.name}</p>
                      )}
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>🧠 {Array.isArray(post.moods) ? post.moods.join(", ") : post.moods}</span>
                        {post.rating > 0 && <span>{"⭐".repeat(Math.min(post.rating, 5))}</span>}
                      </div>
                      {/* Emoji reactions with counts */}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {["😍", "🤤", "👏", "🔥", "❤️"].map((emoji) => {
                          const count = rxCounts[emoji] || 0;
                          return (
                            <button
                              key={emoji}
                              onClick={() => reactToPost(post.id, emoji)}
                              className={`flex items-center gap-0.5 text-sm rounded-full px-2 py-0.5 transition ${
                                myReaction === emoji ? "bg-pink-100 ring-1 ring-pink-300" : "hover:bg-gray-100"
                              }`}
                            >
                              {emoji}
                              {count > 0 && <span className="text-xs text-gray-500 ml-0.5">{count}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </motion.div>
    )}


  </div> // ← make sure you're still inside this main return div
);
}
  