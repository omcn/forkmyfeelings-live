// "use client";
// import { useEffect, useState } from "react";
// import { supabase } from "../../lib/supabaseClient";

// export default function FriendRequests() {
//   const [requests, setRequests] = useState([]);

//   useEffect(() => {
//     const fetchRequests = async () => {
//       const user = (await supabase.auth.getUser()).data.user;

//       const { data, error } = await supabase
//         .from("friends")
//         .select("id, user_id, profiles:profiles!friendships_user_id_fkey(username, avatar_url)")
//         .eq("friend_id", user.id)
//         .eq("status", "pending");

//       if (!error) setRequests(data);
//     };

//     fetchRequests();
//   }, []);

//   const handleAction = async (id, accept) => {
//     if (accept) {
//       await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
//     } else {
//       await supabase.from("friendships").delete().eq("id", id);
//     }

//     setRequests((prev) => prev.filter((r) => r.id !== id));
//   };

//   return (
//     <div className="space-y-3">
//       {requests.map((req) => (
//         <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
//           <div className="flex items-center gap-3">
//             <img
//               src={req.profiles?.avatar_url || "/rascal-fallback.png"}
//               className="w-10 h-10 rounded-full object-cover"
//             />
//             <span>{req.profiles?.username || "Unknown"}</span>
//           </div>
//           <div className="flex gap-2">
//             <button
//               onClick={() => handleAction(req.id, true)}
//               className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded"
//             >
//               ✓
//             </button>
//             <button
//               onClick={() => handleAction(req.id, false)}
//               className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
//             >
//               ✕
//             </button>
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }
"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function FriendList({ currentUser, onClose }) {
  const profile = currentUser; // 👈 rename for internal consistency
  const [friends, setFriends] = useState([]);
  const [rawData, setRawData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("friends")
          .select(`
            id,
            user_id,
            friend_id,
            fk_user_id(username, avatar_url)   // Adjust alias to match FriendRequests
          `)
          .eq("status", "accepted")
          .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`);

        if (error) {
          setError("Failed to fetch friends: " + error.message);
          setLoading(false);
          return;
        }

        setRawData(data);

        const formatted = data.map((f) => {
          const isSender = f.user_id === profile.id;
          const otherProfile = isSender ? f.friend : f.fk_user_id;  // Access fk_user_id for profile

          return {
            id: f.id,
            username: otherProfile?.username || "Unnamed", // Fallback to "Unnamed"
            avatar_url: otherProfile?.avatar_url || "/rascal-fallback.png", // Fallback to default avatar
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
        <h2 className="text-lg font-bold">👥 Your Friends</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ✕
        </button>
      </div>

      {/* 🔍 Profile not available */}
      {!profile?.id && (
        <div className="text-center text-red-600 mb-4">
          ⚠️ Profile ID is missing — are you logged in?
        </div>
      )}

      {/* 🔄 Loading */}
      {loading && (
        <div className="text-center text-gray-500 mt-10">Loading friends...</div>
      )}

      {/* ❌ Error */}
      {error && (
        <div className="text-red-500 text-center mt-6">
          {error}
        </div>
      )}

      {/* ℹ️ No friends */}
      {!loading && !error && friends.length === 0 && profile?.id && (
        <div className="text-center text-gray-500 mt-10">
          No friends yet.
        </div>
      )}

      {/* ✅ Friend List */}
      {!loading && friends.length > 0 && (
        <div className="space-y-3 mt-4">
          {friends.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 border rounded-lg p-3"
            >
              <img
                src={f.avatar_url}
                className="w-10 h-10 rounded-full object-cover"
                alt="Friend avatar"
              />
              <span>{f.username}</span>
            </div>
          ))}
        </div>
      )}

      {/* 🛠 Debug Info */}
      <div className="text-xs bg-gray-100 text-gray-800 mt-8 p-3 rounded shadow-inner max-h-64 overflow-y-auto">
        <strong>Debug Info:</strong>
        <ul className="list-disc list-inside mb-2">
          <li>Profile ID: <code>{profile?.id || "undefined"}</code></li>
          <li>Total Friends: {friends.length}</li>
        </ul>
        <details>
          <summary className="cursor-pointer text-blue-600 mb-2">Raw Supabase Data</summary>
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(rawData, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
}
