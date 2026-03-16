"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import FindFriends from "../components/FindFriends";
import FriendRequests from "../components/FriendRequests";
import FriendList from "../components/FriendList";
import toast from "react-hot-toast";

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
    const file = event.target.files[0];
    if (!file || !user) return;
    const filePath = `${user.id}/avatar.${file.name.split(".").pop()}`;
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

  if (loading) return <div className="p-6 text-center">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-6 py-12">
      {errorMessage && (
        <div className="p-4 mb-4 text-center text-red-600 border border-red-300 rounded-lg">{errorMessage}</div>
      )}

      <div className="relative inline-block">
        <img
          src={profile?.avatar_url || "/rascal-fallback.png"}
          alt="Profile"
          className="w-24 h-24 rounded-full border-4 border-pink-400 mb-4 object-cover"
        />
        {incomingCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
        )}
      </div>

      <label className="mt-2 text-sm text-pink-700 font-medium cursor-pointer">
        Change profile picture
        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="block mt-1 text-sm text-gray-600" />
      </label>

      <h1 className="text-3xl font-bold text-gray-800 my-4">Your Profile</h1>

      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-md space-y-2">
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
      </div>

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
