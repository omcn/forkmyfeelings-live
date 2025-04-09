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

export default function FriendRequests({ currentUser }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from("friends")
        .select("id, user_id, profiles:profiles!friends_user_id_fkey(username, avatar_url)")
        .eq("friend_id", currentUser.id)
        .eq("status", "pending");

      if (!error) setRequests(data);
      else console.error("Error fetching requests:", error.message);
    };

    fetchRequests();
  }, [currentUser]);

  const handleAction = async (id, accept) => {
    if (accept) {
      await supabase.from("friends").update({ status: "accepted" }).eq("id", id);
    } else {
      await supabase.from("friends").delete().eq("id", id);
    }

    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <img
              src={req.profiles?.avatar_url || "/rascal-fallback.png"}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span>{req.profiles?.username || "Unknown"}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(req.id, true)}
              className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded"
            >
              ✓
            </button>
            <button
              onClick={() => handleAction(req.id, false)}
              className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
