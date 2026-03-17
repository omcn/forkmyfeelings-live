"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function FriendList({ currentUser, onClose }) {
  const profile = currentUser;
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!profile?.id) { setLoading(false); return; }
      try {
        const { data, error } = await supabase
          .from("friends")
          .select("id, user_id, friend_id, fk_user_id(username, avatar_url)")
          .eq("status", "accepted")
          .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);

        if (error) { setError("Failed to fetch friends: " + error.message); return; }

        const formatted = data.map((f) => {
          const isSender = f.user_id === profile.id;
          const otherProfile = isSender ? f.fk_user_id : f.fk_user_id;
          return {
            id: f.id,
            username: otherProfile?.username || "Unnamed",
            avatar_url: otherProfile?.avatar_url || "/rascal-fallback.png",
          };
        });
        setFriends(formatted);
      } catch (err) {
        setError("Unexpected error fetching friends.");
        console.error("❌ FriendList fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [profile]);

  return (
    <div className="fixed inset-0 bg-white z-50 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🧑‍🤝‍🧑 Your Friends</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
      </div>

      {!profile?.id && <p className="text-center text-red-600">⚠️ Profile ID missing — are you logged in?</p>}
      {loading && <p className="text-center text-gray-500 mt-10">Loading friends…</p>}
      {!loading && error && <p className="text-red-500 text-center mt-6">{error}</p>}
      {!loading && !error && friends.length === 0 && profile?.id && (
        <div className="text-center mt-16 text-gray-400">
          <div className="text-5xl mb-3">👋</div>
          <p className="font-medium">No friends yet.</p>
          <p className="text-sm mt-1">Use Find Friends to connect with people.</p>
        </div>
      )}

      {!loading && friends.length > 0 && (
        <div className="space-y-3 mt-4">
          {friends.map((f) => (
            <div key={f.id} className="flex items-center gap-3 border border-pink-100 rounded-xl p-3 bg-rose-50">
              <img src={f.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
              <span className="font-medium text-gray-800">@{f.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
