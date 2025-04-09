"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import debounce from "lodash.debounce";

export default function FindFriends({ currentUser, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [incoming, setIncoming] = useState([]);


  // useEffect(() => {
  //   const fetchUsers = async () => {
  //     if (query.trim().length === 0) return setResults([]);
  
  //     const { data, error } = await supabase
  //       .from("profiles")
  //       .select("id, username, avatar_url, email")
  //       .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
  //       .neq("id", currentUser.id)
  //       .limit(10);
  
  //     if (!error) setResults(data);
  //     else console.error("Search error:", error);
  //   };
  
  //   fetchUsers();
  // }, [query, currentUser]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (query.trim().length === 0) return setResults([]);
  
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, avatar_url")
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .neq("id", currentUser.id)
        .limit(10);
  
      if (error) {
        console.error("🔍 Search error:", error.message);
      } else {
        setResults(data);
      }
    };
  
    fetchUsers();
  }, [query, currentUser]);
  

  const handleAccept = async (fromUserId) => {
    await supabase
      .from("friends")
      .update({ status: "accepted" })
      .eq("user_id", fromUserId)
      .eq("friend_id", currentUser.id);
  
    // Optional: also insert reverse row if you want mutual access
    await supabase.from("friends").insert({
      user_id: currentUser.id,
      friend_id: fromUserId,
      status: "accepted",
    });
  
    setIncoming(incoming.filter((req) => req.user_id !== fromUserId));
  };
  
  const handleReject = async (fromUserId) => {
    await supabase
      .from("friends")
      .delete()
      .eq("user_id", fromUserId)
      .eq("friend_id", currentUser.id);
  
    setIncoming(incoming.filter((req) => req.user_id !== fromUserId));
  };
  
  
  
  

  // const sendRequest = async (friendId) => {
  //   await supabase.from("friendships").insert([
  //     { user_id: currentUser.id, friend_id: friendId, status: "pending" },
  //   ]);
  //   alert("Friend request sent!");
  // };
  const sendRequest = async (friendId) => {
    const { data, error } = await supabase.from("friends").insert([
      {
        user_id: currentUser.id,
        friend_id: friendId,
        status: "pending",
      },
    ]);
  
    if (error) {
      console.error("❌ Failed to send request:", error.message);
      alert("Something went wrong!", error);
    } else {
      alert("✅ Friend request sent!");
    }
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
              <img
                src={user.avatar_url || "/rascal-fallback.png"}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span>{user.username || user.email}</span>
            </div>
            <button
              onClick={() => sendRequest(user.id)}
              className="bg-pink-500 hover:bg-pink-600 text-white py-1 px-3 rounded-lg"
            >
              Add +
            </button>
          </div>
        ))}
        {incoming.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">👋 Friend Requests</h3>
            <div className="space-y-3">
              {incoming.map((req) => (
                <div
                  key={req.user_id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={req.profiles.avatar_url || "/rascal-fallback.png"}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span>{req.profiles.username || "Unknown User"}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAccept(req.user_id)}
                      className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded-lg"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleReject(req.user_id)}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-1 px-3 rounded-lg"
                    >
                      Reject
                    </button>
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
