// "use client";
// import { useEffect, useState } from "react";
// import { supabase } from "../../lib/supabaseClient";

// export default function FriendList({ currentUser, onClose }) {
//   const [friends, setFriends] = useState([]);

//   useEffect(() => {
//     const fetchFriends = async () => {
//       const { data, error } = await supabase
//         .from("friends")
//         .select("friend_id, profiles:friend_id (username, avatar_url)")
//         .eq("user_id", currentUser.id)
//         .eq("status", "accepted");

//       if (!error) setFriends(data);
//       else console.error("❌ Failed to fetch friends:", error.message);
//     };

//     fetchFriends();
//   }, [currentUser]);

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
//             <div key={f.friend_id} className="flex items-center gap-3 border rounded-lg p-3">
//               <img
//                 src={f.profiles.avatar_url || "/rascal-fallback.png"}
//                 className="w-10 h-10 rounded-full object-cover"
//               />
//               <span>{f.profiles.username || "Unnamed"}</span>
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

export default function FriendList({ currentUser, onClose }) {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      const { data, error } = await supabase
        .from("friends")
        .select(`
          id,
          user_id,
          friend_id,
          user_profile:user_id (username, avatar_url),
          friend_profile:friend_id (username, avatar_url)
        `)
        .or(`user_id.eq.${currentUser.id},friend_id.eq.${currentUser.id}`)
        .eq("status", "accepted");

      if (error) {
        console.error("❌ Failed to fetch friends:", error.message);
      } else {
        // Filter to only the other person's profile
        const formatted = data.map((f) => {
          const isSender = f.user_id === currentUser.id;
          const otherProfile = isSender ? f.friend_profile : f.user_profile;
          return {
            id: f.id,
            username: otherProfile?.username || "Unnamed",
            avatar_url: otherProfile?.avatar_url || "/rascal-fallback.png",
          };
        });

        setFriends(formatted);
      }
    };

    fetchFriends();
  }, [currentUser]);

  return (
    <div className="fixed inset-0 bg-white z-50 p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">👥 Your Friends</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
      </div>

      {friends.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">No friends yet!</p>
      ) : (
        <div className="space-y-3">
          {friends.map((f) => (
            <div key={f.id} className="flex items-center gap-3 border rounded-lg p-3">
              <img
                src={f.avatar_url}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span>{f.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

