"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

export default function FindFriends({ currentUser, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    if (query.trim().length === 0) { setResults([]); return; }

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, email, avatar_url")
          .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
          .neq("id", currentUser.id)
          .limit(10);

        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        console.error("Search error:", err.message);
        toast.error("Search failed. Try again.");
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [query, currentUser]);

  const handleAccept = async (fromUserId) => {
    await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("user_id", fromUserId)
      .eq("friend_id", currentUser.id);

    await supabase.from("friends").insert({
      user_id: currentUser.id,
      friend_id: fromUserId,
      status: "accepted",
    });

    setIncoming(incoming.filter((req) => req.user_id !== fromUserId));
    toast.success("Friend accepted! 🎉");
  };

  const handleReject = async (fromUserId) => {
    await supabase
      .from("friends")
      .delete()
      .eq("user_id", fromUserId)
      .eq("friend_id", currentUser.id);

    setIncoming(incoming.filter((req) => req.user_id !== fromUserId));
  };

  const sendRequest = async (friendId) => {
    setSending(friendId);
    const { error } = await supabase.from("friends").insert([
      { user_id: currentUser.id, friend_id: friendId, status: "pending" },
    ]);

    if (error) {
      toast.error("Could not send request. Maybe already sent?");
    } else {
      toast.success("✅ Friend request sent!");
    }
    setSending(null);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">🔍 Find Friends</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
          ✕
        </button>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by username..."
        className="w-full px-4 py-2 border rounded-lg mb-4"
      />

      <div className="space-y-3">
        {results.map((user) => (
          <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Image
                src={user.avatar_url || "/rascal-fallback.png"}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
                alt={user.username || "User"}
                unoptimized={!!user.avatar_url}
              />
              <span>{user.username || user.email}</span>
            </div>
            <button
              onClick={() => sendRequest(user.id)}
              disabled={sending === user.id}
              className="bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white py-1 px-3 rounded-lg"
            >
              {sending === user.id ? "Sending…" : "Add +"}
            </button>
          </div>
        ))}

        {incoming.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">👋 Friend Requests</h3>
            <div className="space-y-3">
              {incoming.map((req) => (
                <div key={req.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Image
                      src={req.profiles.avatar_url || "/rascal-fallback.png"}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                      alt="avatar"
                      unoptimized={!!req.profiles.avatar_url}
                    />
                    <span>{req.profiles.username || "Unknown User"}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAccept(req.user_id)} className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-lg">Accept</button>
                    <button onClick={() => handleReject(req.user_id)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-3 rounded-lg">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
