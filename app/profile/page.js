"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import FindFriends from "../components/FindFriends";
import FriendRequests from "../components/FriendRequests";
import FriendList from "../components/FriendList";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { motion, AnimatePresence } from "framer-motion";

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
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "saved" | "history"
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
          if (isMounted) setErrorMessage("⚠️ Failed to retrieve user. Please log in again.");
          return;
        }
        if (isMounted) setUser(user);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError || !profileData) {
          if (isMounted) setErrorMessage("⚠️ Could not fetch your profile data.");
          return;
        }

        if (isMounted) {
          setProfile(profileData);
          setFormData({ username: profileData.username || "", bio: profileData.bio || "" });
        }
      } catch (err) {
        if (isMounted) setErrorMessage("Unexpected error. Try again later.");
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Load localStorage data
    try {
      const raw = localStorage.getItem("fmf_saved_recipes");
      setSavedRecipes(raw ? JSON.parse(raw) : []);
    } catch { setSavedRecipes([]); }
    try {
      const raw = localStorage.getItem("fmf_cook_history");
      setCookHistory(raw ? JSON.parse(raw) : []);
    } catch { setCookHistory([]); }

    fetchProfile();
    timeout = setTimeout(() => {
      if (isMounted && loading) {
        setLoading(false);
        setErrorMessage("⏱️ Request timed out. Try refreshing.");
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
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({ id: user.id, username: formData.username, bio: formData.bio });
    if (!error) { toast.success("Profile updated ✅"); router.push("/"); }
    else toast.error("Update failed: " + error.message);
  };

  const handleAvatarUpload = async (event) => {
    const rawFile = event.target.files[0];
    if (!rawFile || !user) return;
    // Compress avatar before upload
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
      toast.success("Profile picture updated ✅");
      router.refresh();
    } catch (err) {
      toast.error("Failed to upload avatar: " + err.message);
    }
  };

  const removeSaved = (id) => {
    const next = savedRecipes.filter((r) => r.id !== id);
    setSavedRecipes(next);
    localStorage.setItem("fmf_saved_recipes", JSON.stringify(next));
    toast("Removed from saved", { icon: "💔" });
  };

  // Compute cook streak from history (consecutive days ending today/yesterday)
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

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center px-6 py-12">
      {errorMessage && (
        <div className="p-4 mb-4 text-center text-red-600 border border-red-300 rounded-lg">{errorMessage}</div>
      )}

      <div className="relative inline-block">
        <Image
          src={profile?.avatar_url || "/rascal-fallback.png"}
          alt="Profile"
          width={96}
          height={96}
          className="w-24 h-24 rounded-full border-4 border-pink-400 mb-4 object-cover"
          unoptimized={!!profile?.avatar_url}
        />
        {incomingCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
        )}
      </div>

      <label className="mt-2 text-sm text-pink-700 font-medium cursor-pointer">
        Change profile picture
        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="block mt-1 text-sm text-gray-600" />
      </label>

      <h1 className="text-3xl font-bold text-gray-800 mt-4 mb-1">
        {profile?.username ? `@${profile.username}` : "Your Profile"}
      </h1>
      {cookStreak > 0 && (
        <div className="flex items-center gap-1.5 bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          🔥 {cookStreak} day{cookStreak > 1 ? "s" : ""} cooking streak!
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4 w-full max-w-md">
        {[
          { key: "profile", label: "⚙️ Profile" },
          { key: "saved", label: `❤️ Saved (${savedRecipes.length})` },
          { key: "history", label: `🍳 History (${cookHistory.length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
              activeTab === tab.key
                ? "bg-pink-500 text-white shadow"
                : "bg-white text-gray-600 border border-pink-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "profile" && (
          <motion.div
            key="profile-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-md space-y-2"
          >
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} className="mb-4 w-full px-3 py-2 rounded-lg border border-gray-300" />

            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea name="bio" rows={3} value={formData.bio} onChange={handleChange} className="mb-4 w-full px-3 py-2 rounded-lg border border-gray-300" />

            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowFindFriends(true)} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-xl text-sm">🔍 Find Friends</button>
              <button onClick={() => { setShowRequests(true); setShowFriends(false); }} className="relative bg-yellow-300 hover:bg-yellow-400 text-yellow-900 py-2 px-4 rounded-xl text-sm">
                👥 Requests
                {incomingCount > 0 && <span className="absolute -top-2 -right-2 bg-red-500 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center">{incomingCount}</span>}
              </button>
              <button onClick={() => { setShowFriends(true); setShowRequests(false); }} className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-xl text-sm">🧑‍🤝‍🧑 Friends</button>
            </div>

            <button onClick={() => router.push("/submit")} className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg">📤 Submit a Recipe</button>
            <button onClick={handleSave} className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded-lg">Save Changes</button>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
              className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-medium py-2 px-4 rounded-lg transition"
            >
              Sign Out
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition"
            >
              🏆 Leaderboard
            </button>
            <button
              onClick={() => router.push("/admin")}
              className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition"
            >
              🛠️ Admin Panel
            </button>
            <button
              onClick={async () => {
                if (!confirm("Are you sure? This will permanently delete your account and all your data. This cannot be undone.")) return;
                if (!confirm("Really delete? Last chance!")) return;
                try {
                  // Delete user data from Supabase tables
                  const uid = user.id;
                  await Promise.allSettled([
                    supabase.from("recipe_posts").delete().eq("user_id", uid),
                    supabase.from("recipe_ratings").delete().eq("user_id", uid),
                    supabase.from("post_reactions").delete().eq("user_id", uid),
                    supabase.from("saved_recipes").delete().eq("user_id", uid),
                    supabase.from("notifications").delete().eq("user_id", uid),
                    supabase.from("notifications").delete().eq("actor_id", uid),
                    supabase.from("friends").delete().or(`user_id.eq.${uid},friend_id.eq.${uid}`),
                    supabase.from("profiles").delete().eq("id", uid),
                  ]);
                  // Clear localStorage
                  Object.keys(localStorage).filter((k) => k.startsWith("fmf_")).forEach((k) => localStorage.removeItem(k));
                  // Sign out
                  await supabase.auth.signOut();
                  toast.success("Account deleted.");
                  router.push("/");
                } catch (err) {
                  toast.error("Failed to delete account. Please contact support.");
                  console.error(err);
                }
              }}
              className="w-full text-xs text-red-400 hover:text-red-600 py-1 transition mt-4"
            >
              🗑️ Delete Account
            </button>
          </motion.div>
        )}

        {activeTab === "saved" && (
          <motion.div
            key="saved-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-md space-y-3"
          >
            {savedRecipes.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-md">
                <div className="text-5xl mb-3">🍽️</div>
                <p className="text-gray-500 font-medium">No saved recipes yet.</p>
                <p className="text-sm text-gray-400 mt-1">Tap the ❤️ on any recipe to save it here.</p>
              </div>
            ) : (
              savedRecipes.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl p-4 shadow-md flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{r.emoji} {r.name}</p>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{r.description}</p>
                  </div>
                  <button
                    onClick={() => removeSaved(r.id)}
                    className="text-pink-400 hover:text-pink-600 text-xl shrink-0"
                    title="Remove"
                  >
                    🗑️
                  </button>
                </div>
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
            className="w-full max-w-md space-y-3"
          >
            {cookHistory.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-md">
                <div className="text-5xl mb-3">👨‍🍳</div>
                <p className="text-gray-500 font-medium">No recipes cooked yet.</p>
                <p className="text-sm text-gray-400 mt-1">Start a recipe and it'll appear here.</p>
              </div>
            ) : (
              cookHistory.map((r, i) => (
                <div key={`${r.id}-${i}`} className="bg-white rounded-2xl p-4 shadow-md flex items-center gap-3">
                  <span className="text-3xl">{r.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.cookedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {showFindFriends && <FindFriends currentUser={profile} onClose={() => setShowFindFriends(false)} />}
      {showFriends && !showRequests && <FriendList currentUser={profile} onClose={() => setShowFriends(false)} />}
      {showRequests && profile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button onClick={() => setShowRequests(false)} className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-xl">✕</button>
            <h2 className="text-xl font-bold mb-4">👥 Friend Requests</h2>
            {incomingCount === 0 ? (
              <p className="text-center text-gray-500">No new requests</p>
            ) : (
              <FriendRequests currentUser={profile} onClose={() => setShowRequests(false)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
