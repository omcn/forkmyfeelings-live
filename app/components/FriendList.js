




// "use client";
// import { useEffect, useState } from "react";
// import { supabase } from "../../lib/supabaseClient";

// export default function FriendList({ profile, onClose }) {
//   const [friends, setFriends] = useState([]);

//   useEffect(() => {
//     const fetchFriends = async () => {
//       if (!profile?.id) return;

//       const { data, error } = await supabase
//         .from("friends")
//         .select(`
//           id,
//           user_id,
//           friend_id,
//           fk_user: user_id (username, avatar_url),
//           fk_friend: friend_id (username, avatar_url)
//         `)
//         .or(`(user_id.eq.${profile.id},friend_id.eq.${profile.id})`)
//         .eq("status", "accepted");

//       if (error) {
//         console.error("❌ Failed to fetch friends:", error.message);
//         return;
//       }

//       const formatted = data.map((f) => {
//         const isSender = f.user_id === profile.id;
//         const otherProfile = isSender ? f.fk_friend : f.fk_user;

//         return {
//           id: f.id,
//           username: otherProfile?.username || "Unnamed",
//           avatar_url: otherProfile?.avatar_url || "/rascal-fallback.png",
//         };
//       });

//       setFriends(formatted);
//     };

//     fetchFriends();
//   }, [profile]);

//   return (
//     <div className="fixed inset-0 bg-white z-50 p-6 overflow-y-auto">
//       <div className="flex justify-between items-center mb-4">
//         <h2 className="text-lg font-bold">👥 Your Friends</h2>
//         <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
//       </div>

//       {friends.length === 0 ? (
//         <p className="text-gray-500 text-center mt-10">No friends yet!</p>
//       ) : (
//         <div className="space-y-3">
//           {friends.map((f) => (
//             <div key={f.id} className="flex items-center gap-3 border rounded-lg p-3">
//               <img
//                 src={f.avatar_url}
//                 className="w-10 h-10 rounded-full object-cover"
//                 alt="Friend avatar"
//               />
//               <span>{f.username}</span>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function FriendList({ profile, onClose }) {
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
            user: user_id (username, avatar_url),
            friend: friend_id (username, avatar_url)
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
          const otherProfile = isSender ? f.friend : f.user;

          return {
            id: f.id,
            username: otherProfile?.username || "Unnamed",
            avatar_url: otherProfile?.avatar_url || "/rascal-fallback.png",
          };
        });

        setFriends(formatted);
      } catch (err) {
        setError("Unexpected error fetching friends.");
        console.error("❌ Fetch error:", err);
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

      {/* 🔍 Debug: Missing profile */}
      {!profile?.id && (
        <div className="text-center text-red-600 mb-4">
          ⚠️ Profile ID is missing — are you logged in?
        </div>
      )}

      {/* 🔄 Loading state */}
      {loading && (
        <div className="text-center text-gray-500 mt-10">Loading friends...</div>
      )}

      {/* ❌ Error state */}
      {error && (
        <div className="text-red-500 text-center mt-6">
          {error}
        </div>
      )}

      {/* ℹ️ No friends state */}
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

      {/* 🛠 Debug Output */}
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
