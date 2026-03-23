"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function FriendRequests({ currentUser }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("friends")
        .select("id, user_id, profile:fk_user_id(username, avatar_url)")
        .eq("friend_id", currentUser.id)
        .eq("status", "pending");
      if (isMounted && !error) setRequests(data);
      else if (error) console.error("Error fetching requests:", error.message);
    };
    fetchRequests();
    return () => { isMounted = false; };
  }, [currentUser]);

  const handleAction = async (id, accept) => {
    if (accept) {
      await supabase.from("friends").update({ status: "accepted" }).eq("id", id);
    } else {
      await supabase.from("friends").delete().eq("id", id);
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  if (requests.length === 0) {
    return <p className="text-center text-gray-500 py-4">No pending requests.</p>;
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="flex items-center justify-between p-3 border border-pink-100 rounded-xl bg-rose-50">
          <div className="flex items-center gap-3">
            <img
              src={req.profile?.avatar_url || "/rascal-fallback.png"}
              className="w-10 h-10 rounded-full object-cover"
              alt={`${req.profile?.username || "User"}'s avatar`}
            />
            <span className="font-medium text-gray-800">@{req.profile?.username || "Unknown"}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(req.id, true)}
              className="bg-green-500 hover:bg-green-600 text-white py-1.5 px-3 rounded-lg text-sm font-semibold"
            >
              ✓ Accept
            </button>
            <button
              onClick={() => handleAction(req.id, false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 px-3 rounded-lg text-sm font-semibold"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
