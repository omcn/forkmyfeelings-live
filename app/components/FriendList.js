




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
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!profile?.id) return;

      // Step 1: get all accepted friend rows
      const { data: friendRelations, error: fetchError } = await supabase
        .from("friends")
        .select("*")
        .or(`(user_id.eq.${profile.id},friend_id.eq.${profile.id})`)
        .eq("status", "accepted");

      if (fetchError) {
        console.error("❌ Failed to fetch friend relations:", fetchError.message);
        setError("Failed to fetch friends.");
        return;
      }

      if (!friendRelations || friendRelations.length === 0) {
        setFriends([]);
        return;
      }

      // Step 2: extract the other user’s ID
      const otherUserIds = friendRelations.map(f =>
        f.user_id === profile.id ? f.friend_id : f.user_id
      );

      // Step 3: fetch their profiles manually
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", otherUserIds);

      if (profileError) {
        console.error("❌ Failed to fetch profile data:", profileError.message);
        setError("Failed to fetch profile info.");
        return;
      }

      const formatted = profiles.map((p) => ({
        id: p.id,
        username: p.username || "Unnamed",
        avatar_url: p.avatar_url || "/rascal-fallback.png",
      }));

      setFriends(formatted);
    };

    fetchFriends();
  }, [profile]);

  return (
    <div className="fixed inset-0 bg-white z-50 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">👥 Your Friends</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
      </div>

      {error && (
        <p className="text-red-500 text-center">{error}</p>
      )}

      {!error && friends.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No friends yet!</p>
      ) : (
        <div className="space-y-3">
          {friends.map((f) => (
            <div key={f.id} className="flex items-center gap-3 border rounded-lg p-3">
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
