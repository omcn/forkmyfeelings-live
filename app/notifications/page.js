"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";

const TYPE_META = {
  reaction: { icon: "😍", label: "reacted to your post" },
  friend_request: { icon: "👋", label: "sent you a friend request" },
  friend_accepted: { icon: "🤝", label: "accepted your friend request" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { router.push("/"); return; }
      setUser(session.user);

      const { data } = await supabase
        .from("notifications")
        .select("*, actor:actor_id(username, avatar_url)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications(data || []);

      // Mark all as read
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", session.user.id)
        .eq("read", false);

      setLoading(false);
    };
    load();
  }, []);

  const handleAcceptFriend = async (notif) => {
    await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("user_id", notif.actor_id)
      .eq("friend_id", user.id);
    // Create accepted notification back
    await supabase.from("notifications").insert({
      user_id: notif.actor_id,
      type: "friend_accepted",
      actor_id: user.id,
      resource_id: user.id,
      read: false,
    });
    setNotifications((prev) =>
      prev.map((n) => n.id === notif.id ? { ...n, handled: true } : n)
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 px-4 py-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🔔 Notifications</h1>
        <button onClick={() => router.push("/")} className="text-sm text-pink-600 hover:text-pink-800 font-medium">
          ← Home
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔔</div>
          <p className="font-medium">All caught up!</p>
          <p className="text-sm mt-1">You'll see reactions and friend requests here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => {
            const meta = TYPE_META[notif.type] || { icon: "📣", label: "sent you a notification" };
            const actor = notif.actor;
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-2xl p-4 shadow-sm flex items-start gap-3 ${
                  !notif.read ? "ring-1 ring-pink-200" : ""
                }`}
              >
                <div className="relative shrink-0">
                  <Image
                    src={actor?.avatar_url || "/rascal-fallback.png"}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border border-pink-100"
                    unoptimized={!!actor?.avatar_url}
                  />
                  <span className="absolute -bottom-1 -right-1 text-sm">{meta.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">
                    <a href={`/user/${notif.actor_id}`} className="font-semibold hover:text-pink-600">
                      @{actor?.username || "Someone"}
                    </a>{" "}
                    {meta.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(notif.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                  {notif.type === "friend_request" && !notif.handled && (
                    <button
                      onClick={() => handleAcceptFriend(notif)}
                      className="mt-2 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full font-semibold transition"
                    >
                      ✓ Accept
                    </button>
                  )}
                  {notif.handled && notif.type === "friend_request" && (
                    <span className="mt-2 text-xs text-green-600 font-medium">✓ Accepted</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
