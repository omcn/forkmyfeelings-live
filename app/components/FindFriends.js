"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import debounce from "lodash.debounce";

export default function FindFriends({ currentUser, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (query.trim().length === 0) return setResults([]);
  
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, email")
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .neq("id", currentUser.id)
        .limit(10);
  
      if (!error) setResults(data);
      else console.error("Search error:", error);
    };
  
    fetchUsers();
  }, [query, currentUser]);
  
  

  const sendRequest = async (friendId) => {
    await supabase.from("friendships").insert([
      { user_id: currentUser.id, friend_id: friendId, status: "pending" },
    ]);
    alert("Friend request sent!");
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
      </div>
    </div>
  );
}
