"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";

export default function UserProfilePage() {
  const router = useRouter();
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [friendStatus, setFriendStatus] = useState(null); // null | "pending" | "accepted" | "sent"
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      const me = session?.user?.id;
      setCurrentUserId(me);

      // Load profile
      const { data: prof } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .eq("id", id)
        .single();
      if (!isMounted) return;
      if (!prof) { router.push("/"); return; }
      setProfile(prof);

      // Load their posts
      const { data: postData } = await supabase
        .from("recipe_posts")
        .select("*, recipes(name, emoji)")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(12);
      if (!isMounted) return;
      setPosts(postData || []);

      // Check friendship status
      if (me && me !== id) {
        const { data: friendship } = await supabase
          .from("friends")
          .select("id, status, user_id, friend_id")
          .or(`and(user_id.eq.${me},friend_id.eq.${id}),and(user_id.eq.${id},friend_id.eq.${me})`)
          .maybeSingle();
        if (!isMounted) return;
        if (friendship) {
          if (friendship.status === "accepted") setFriendStatus("accepted");
          else if (friendship.user_id === me) setFriendStatus("sent");
          else setFriendStatus("pending");
        }
      }

      setLoading(false);
    };
    load();
    return () => { isMounted = false; };
  }, [id]);

  const sendFriendRequest = async () => {
    if (!currentUserId) return;
    setActionLoading(true);
    await supabase.from("friends").insert({ user_id: currentUserId, friend_id: id, status: "pending" });
    // Notify the target user
    await supabase.from("notifications").insert({
      user_id: id,
      type: "friend_request",
      actor_id: currentUserId,
      resource_id: currentUserId,
      read: false,
    });
    setFriendStatus("sent");
    setActionLoading(false);
  };

  const isMe = currentUserId === id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 px-4 py-8 max-w-md mx-auto">
      <button
        onClick={() => router.back()}
        className="text-sm text-pink-600 hover:text-pink-800 font-medium mb-6 flex items-center gap-1"
      >
        ← Back
      </button>

      {loading ? (
        <div className="space-y-4">
          <div className="h-32 bg-white rounded-2xl animate-pulse" />
          <div className="grid grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />)}
          </div>
        </div>
      ) : profile ? (
        <>
          {/* Profile card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 flex items-center gap-4">
            <img
              src={profile.avatar_url || "/rascal-fallback.png"}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-pink-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold text-gray-900">
                @{profile.username || "unknown"}
              </p>
              {profile.bio && (
                <p className="text-sm text-gray-500 mt-0.5 truncate">{profile.bio}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">{posts.length} post{posts.length !== 1 ? "s" : ""}</p>
            </div>
            {!isMe && currentUserId && (
              <div>
                {friendStatus === "accepted" ? (
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-semibold">✓ Friends</span>
                ) : friendStatus === "sent" ? (
                  <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full font-semibold">Pending…</span>
                ) : friendStatus === "pending" ? (
                  <button
                    onClick={sendFriendRequest}
                    disabled={actionLoading}
                    className="text-xs bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-full font-semibold transition"
                  >
                    ✓ Accept
                  </button>
                ) : (
                  <button
                    onClick={sendFriendRequest}
                    disabled={actionLoading}
                    className="text-xs bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white px-3 py-1.5 rounded-full font-semibold transition"
                  >
                    + Add Friend
                  </button>
                )}
              </div>
            )}
            {isMe && (
              <button
                onClick={() => router.push("/profile")}
                className="text-xs text-pink-600 border border-pink-200 px-3 py-1.5 rounded-full font-semibold hover:bg-pink-50 transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Posts grid */}
          {posts.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-5xl mb-3">🍽️</div>
              <p className="font-medium">No posts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {posts.map((post) => (
                <div key={post.id} className="aspect-square bg-white rounded-xl overflow-hidden shadow-sm relative">
                  {post.photo_url ? (
                    <img src={post.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50">
                      <span className="text-2xl">{post.recipes?.emoji || "🍽️"}</span>
                      <span className="text-[10px] text-gray-500 text-center px-1 mt-1 leading-tight truncate w-full px-2">{post.recipes?.name}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p>User not found.</p>
        </div>
      )}
    </div>
  );
}
