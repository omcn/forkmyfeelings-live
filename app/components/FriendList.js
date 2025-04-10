




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
  const [rawData, setRawData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!profile?.id) return;

      setLoading(true);
      setError(null);

      try {
        // Step 1: Fetch accepted friend relationships
        const { data: relations, error: relationError } = await supabase
          .from("friends")
          .select("*")
          .eq("status", "accepted")
          .or(`user_id.eq.${profile.id},friend_id.eq.${profile.id}`); // show friends where current user is either side

        if (relationError) {
          setError("Failed to fetch friends.");
          console.error("Friends query error:", relationError.message);
          setLoading(false);
          return;
        }

        setRawData(relations); // for debugging

        // Step 2: Extract the IDs of the other users
        const otherIds = relations.map((r) =>
          r.user_id === profile.id ? r.friend_id : r.user_id
        );

        const validIds = otherIds.filter((id) => !!id && typeof id === "string");

        if (validIds.length === 0) {
          setFriends([]);
          setLoading(false);
          return;
        }

        // Step 3: Fetch profile data of the other users
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", validIds);

        if (profileError) {
          setError("Failed to fetch profiles.");
          console.error("Profile fetch error:", profileError.message);
          setLoading(false);
          return;
        }

        const formatted = profiles.map((p) => ({
          id: p.id,
          username: p.username || "Unnamed",
          avatar_url: p.avatar_url || "/rascal-fallback.png",
        }));

        setFriends(formatted);
      } catch (err) {
        console.error("General FriendList error:", err);
        setError("Unexpected error loading friends.");
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

      {error && (
        <div className="text-red-500 text-center mb-4">{error}</div>
      )}

      {loading && (
        <p className="text-gray-400 text-center mb-4">Loading friends...</p>
      )}

      <div className="text-xs bg-gray-100 p-2 rounded mb-4">
        <strong>Raw friend rows:</strong>
        <pre>{JSON.stringify(rawData, null, 2)}</pre>
      </div>

      {!loading && friends.length === 0 && !error ? (
        <p className="text-gray-500 text-center mt-10">No friends yet!</p>
      ) : (
        <div className="space-y-3">
          {friends.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 border rounded-lg p-3"
            >
              <img
                src={f.avatar_url}
                className="w-10 h-10 rounded-full object-cover"
                alt="Avatar"
              />
              <span>{f.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
