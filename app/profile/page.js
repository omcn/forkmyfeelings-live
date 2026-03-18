"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import FindFriends from "../components/FindFriends";
import FriendRequests from "../components/FriendRequests";
import FriendList from "../components/FriendList";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";
import RecipeDetailModal from "../components/RecipeDetailModal";

/** Safely parse a JSON array from localStorage with basic validation */
function safeParseArray(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    // Corrupted data — clear it and return empty
    try { localStorage.removeItem(key); } catch {}
    return [];
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ username: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [incomingCount, setIncomingCount] = useState(0);
  const [showFriends, setShowFriends] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [cookHistory, setCookHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("saved");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const undoTimerRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    let timeout;
    let isMounted = true;

    const fetchProfile = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (sessionError || !user) {
          if (isMounted) setErrorMessage("Failed to retrieve user. Please log in again.");
          return;
        }
        if (isMounted) setUser(user);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError || !profileData) {
          if (isMounted) setErrorMessage("Could not fetch your profile data.");
          return;
        }

        if (isMounted) {
          setProfile(profileData);
          setFormData({ username: profileData.username || "", bio: profileData.bio || "" });
          if (profileData.is_admin) setIsAdmin(true);
        }
      } catch (err) {
        if (isMounted) setErrorMessage("Unexpected error. Try again later.");
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Load localStorage data as initial state, then sync from Supabase
    setSavedRecipes(safeParseArray("fmf_saved_recipes"));
    setCookHistory(safeParseArray("fmf_cook_history"));

    fetchProfile().then(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: savedData } = await supabase
            .from("saved_recipes")
            .select("recipe_id, recipes(id, name, emoji, description)")
            .eq("user_id", session.user.id);
          if (savedData?.length > 0) {
            const savedArr = savedData.map((s) => s.recipes).filter(Boolean);
            setSavedRecipes(savedArr);
            localStorage.setItem("fmf_saved_recipes", JSON.stringify(savedArr));
          }
        }
      } catch {}
    });
    timeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
        setErrorMessage("Request timed out. Try refreshing.");
      }
    }, 15000);

    return () => { clearTimeout(timeout); isMounted = false; };
  }, []);

  useEffect(() => {
    const fetchPending = async () => {
      if (!profile) return;
      const { data } = await supabase
        .from("friends")
        .select("*")
        .eq("friend_id", profile.id)
        .eq("status", "pending");
      if (data) setIncomingCount(data.length);
    };
    fetchPending();
  }, [profile]);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!user || saving) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({ id: user.id, username: formData.username, bio: formData.bio });
    setSaving(false);
    if (!error) toast.success("Profile saved");
    else toast.error("Update failed: " + error.message);
  };

  const handleAvatarUpload = async (event) => {
    const rawFile = event.target.files[0];
    if (!rawFile || !user) return;
    let file;
    try {
      file = await imageCompression(rawFile, { maxSizeMB: 0.3, maxWidthOrHeight: 400, useWebWorker: true });
    } catch {
      file = rawFile;
    }
    const filePath = `${user.id}/avatar.${rawFile.name.split(".").pop()}`;
    try {
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      if (!publicUrl) throw new Error("No public URL returned");
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
      if (updateError) throw updateError;
      toast.success("Photo updated");
      router.refresh();
    } catch (err) {
      toast.error("Failed to upload: " + err.message);
    }
  };

  const removeSaved = (id) => {
    const removed = savedRecipes.find((r) => r.id === id);
    const next = savedRecipes.filter((r) => r.id !== id);
    setSavedRecipes(next);
    localStorage.setItem("fmf_saved_recipes", JSON.stringify(next));

    // Also remove from Supabase
    if (user) {
      supabase.from("saved_recipes").delete().eq("user_id", user.id).eq("recipe_id", id);
    }

    // Clear any existing undo timer
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    // Show undo toast
    const toastId = toast(
      (t) => (
        <div className="flex items-center gap-3">
          <span>Removed {removed?.emoji} {removed?.name}</span>
          <button
            onClick={() => {
              // Restore the recipe
              const restored = [...next, removed];
              setSavedRecipes(restored);
              localStorage.setItem("fmf_saved_recipes", JSON.stringify(restored));
              if (user) {
                supabase.from("saved_recipes").upsert(
                  { user_id: user.id, recipe_id: id },
                  { onConflict: "user_id,recipe_id" }
                );
              }
              toast.dismiss(t.id);
            }}
            className="font-bold text-pink-600 hover:text-pink-800 whitespace-nowrap"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000, icon: "💔" }
    );

    undoTimerRef.current = setTimeout(() => { undoTimerRef.current = null; }, 5000);
  };

  // Compute cook streak
  const cookStreak = (() => {
    if (!cookHistory.length) return 0;
    const days = [...new Set(cookHistory.map((h) => h.cookedAt.slice(0, 10)))].sort().reverse();
    let streak = 0;
    let check = new Date();
    check.setHours(0, 0, 0, 0);
    for (const day of days) {
      const d = new Date(day);
      const diff = Math.round((check - d) / 86400000);
      if (diff === 0 || diff === 1) { streak++; check = d; }
      else break;
    }
    return streak;
  })();

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center px-6 py-12">
      <div className="w-24 h-24 rounded-full bg-pink-200 animate-pulse mb-4" />
      <div className="w-32 h-4 bg-pink-100 rounded-full animate-pulse mb-2" />
      <div className="w-48 h-8 bg-pink-200 rounded-full animate-pulse mb-6" />
      <div className="flex gap-2 mb-4 w-full max-w-md">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex-1 h-10 bg-white rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-md space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center px-4 py-8 pb-24">
      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="self-start mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition"
      >
        <span className="text-lg">←</span> Home
      </button>

      {errorMessage && (
        <div className="w-full max-w-md p-3 mb-4 text-center text-red-600 bg-red-50 border border-red-200 rounded-xl text-sm">{errorMessage}</div>
      )}

      {/* Profile header card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-md p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <Image
              src={profile?.avatar_url || "/rascal-fallback.png"}
              alt="Profile"
              width={80}
              height={80}
              className="w-20 h-20 rounded-full border-3 border-pink-300 object-cover"
              unoptimized={!!profile?.avatar_url}
            />
            <label className="absolute -bottom-1 -right-1 bg-pink-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm cursor-pointer shadow-md hover:bg-pink-600 transition">
              <span>+</span>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">
              {profile?.username ? `@${profile.username}` : "Your Profile"}
            </h1>
            {profile?.bio && (
              <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{profile.bio}</p>
            )}
            {cookStreak > 0 && (
              <div className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full mt-2">
                🔥 {cookStreak} day{cookStreak > 1 ? "s" : ""} streak
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-gray-900">{savedRecipes.length}</p>
            <p className="text-xs text-gray-500">Saved</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-gray-900">{cookHistory.length}</p>
            <p className="text-xs text-gray-500">Cooked</p>
          </div>
          <div className="flex-1 text-center">
            <p className="text-lg font-bold text-gray-900">{cookStreak}</p>
            <p className="text-xs text-gray-500">Streak</p>
          </div>
        </div>
      </div>

      {/* Social buttons */}
      <div className="w-full max-w-md flex gap-2 mb-4">
        <button
          onClick={() => setShowFindFriends(true)}
          className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
        >
          🔍 Find Friends
        </button>
        <button
          onClick={() => { setShowRequests(true); setShowFriends(false); }}
          className="relative flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
        >
          👥 Requests
          {incomingCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-pink-500 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center">{incomingCount}</span>
          )}
        </button>
        <button
          onClick={() => { setShowFriends(true); setShowRequests(false); }}
          className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
        >
          🧑‍🤝‍🧑 Friends
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-4 w-full max-w-md bg-white/60 p-1 rounded-xl">
        {[
          { key: "saved", label: `❤️ Saved` },
          { key: "history", label: `🍳 History` },
          { key: "settings", label: `⚙️ Settings` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-white text-pink-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "saved" && (
          <motion.div
            key="saved-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md space-y-2.5"
          >
            {savedRecipes.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <div className="text-5xl mb-3">🍽️</div>
                <p className="text-gray-700 font-semibold mb-1">No saved recipes yet</p>
                <p className="text-sm text-gray-400 mb-4">Tap the heart on any recipe to save it here.</p>
                <button
                  onClick={() => router.push("/")}
                  className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2.5 px-6 rounded-full text-sm transition"
                >
                  Browse Recipes
                </button>
              </div>
            ) : (
              savedRecipes.map((r) => (
                <motion.div
                  key={r.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  <button
                    onClick={() => setSelectedRecipe(r)}
                    className="w-full flex items-center gap-3 p-4 text-left active:bg-gray-50 transition"
                  >
                    <span className="text-3xl shrink-0">{r.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{r.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeSaved(r.id); }}
                        className="text-gray-300 hover:text-red-400 text-lg transition p-1"
                        title="Remove"
                      >
                        🗑️
                      </button>
                      <span className="text-gray-300 text-sm">›</span>
                    </div>
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div
            key="history-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md space-y-2.5"
          >
            {cookHistory.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                <div className="text-5xl mb-3">👨‍🍳</div>
                <p className="text-gray-700 font-semibold mb-1">No recipes cooked yet</p>
                <p className="text-sm text-gray-400 mb-4">Start cooking and your history will appear here.</p>
                <button
                  onClick={() => router.push("/")}
                  className="bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2.5 px-6 rounded-full text-sm transition"
                >
                  Find a Recipe
                </button>
              </div>
            ) : (
              cookHistory.map((r, i) => (
                <button
                  key={`${r.id}-${i}`}
                  onClick={() => setSelectedRecipe(r)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 text-left active:bg-gray-50 transition"
                >
                  <span className="text-3xl shrink-0">{r.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.cookedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className="text-gray-300 text-sm shrink-0">›</span>
                </button>
              ))
            )}
          </motion.div>
        )}

        {activeTab === "settings" && (
          <motion.div
            key="settings-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md space-y-3"
          >
            {/* Edit profile card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Edit Profile</h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
                <textarea
                  name="bio"
                  rows={2}
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-300 transition resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-pink-300 text-white font-semibold py-2.5 rounded-xl text-sm transition"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {/* Quick links card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
              <button
                onClick={() => router.push("/submit")}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 transition"
              >
                <span className="text-lg">📤</span>
                <span className="text-sm font-medium text-gray-700">Submit a Recipe</span>
                <span className="ml-auto text-gray-300 text-sm">›</span>
              </button>
              <button
                onClick={() => router.push("/leaderboard")}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 transition"
              >
                <span className="text-lg">🏆</span>
                <span className="text-sm font-medium text-gray-700">Leaderboard</span>
                <span className="ml-auto text-gray-300 text-sm">›</span>
              </button>
              <button
                onClick={() => router.push("/insights")}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 transition"
              >
                <span className="text-lg">📊</span>
                <span className="text-sm font-medium text-gray-700">My Insights</span>
                <span className="ml-auto text-gray-300 text-sm">›</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => router.push("/admin")}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 transition"
                >
                  <span className="text-lg">🛠️</span>
                  <span className="text-sm font-medium text-gray-700">Admin Panel</span>
                  <span className="ml-auto text-gray-300 text-sm">›</span>
                </button>
              )}
            </div>

            {/* Account actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
              <button
                onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-gray-50 transition"
              >
                <span className="text-lg">👋</span>
                <span className="text-sm font-medium text-gray-700">Sign Out</span>
              </button>
              <button
                onClick={async () => {
                  if (!confirm("Are you sure? This will permanently delete your account and all your data. This cannot be undone.")) return;
                  if (!confirm("Really delete? Last chance!")) return;
                  try {
                    const { error: rpcError } = await supabase.rpc("delete_user_cascade", {
                      target_user_id: user.id,
                    });
                    if (rpcError) throw rpcError;
                    Object.keys(localStorage).filter((k) => k.startsWith("fmf_")).forEach((k) => localStorage.removeItem(k));
                    await supabase.auth.signOut();
                    toast.success("Account deleted.");
                    router.push("/");
                  } catch (err) {
                    toast.error("Failed to delete account. Please contact support.");
                    console.error(err);
                  }
                }}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-red-50 transition"
              >
                <span className="text-lg">🗑️</span>
                <span className="text-sm font-medium text-red-500">Delete Account</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRecipe && (
          <RecipeDetailModal
            recipeId={selectedRecipe.id}
            recipeSummary={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onMakeIt={(fullRecipe) => {
              try {
                const raw = localStorage.getItem("fmf_cook_history");
                const history = raw ? JSON.parse(raw) : [];
                const entry = { id: fullRecipe.id, name: fullRecipe.name, emoji: fullRecipe.emoji, cookedAt: new Date().toISOString() };
                const deduped = [entry, ...history.filter((h) => h.id !== fullRecipe.id)].slice(0, 20);
                localStorage.setItem("fmf_cook_history", JSON.stringify(deduped));
              } catch {}
              localStorage.setItem("fmf_start_cooking", JSON.stringify(fullRecipe));
              router.push("/");
            }}
          />
        )}
      </AnimatePresence>

      {showFindFriends && <FindFriends currentUser={profile} onClose={() => setShowFindFriends(false)} />}
      {showFriends && !showRequests && <FriendList currentUser={profile} onClose={() => setShowFriends(false)} />}
      {showRequests && profile && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowRequests(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl">✕</button>
            <h2 className="text-lg font-bold mb-4">Friend Requests</h2>
            {incomingCount === 0 ? (
              <p className="text-center text-gray-500 py-4">No new requests</p>
            ) : (
              <FriendRequests currentUser={profile} onClose={() => setShowRequests(false)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
