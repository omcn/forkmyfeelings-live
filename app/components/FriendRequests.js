
// "use client";
// import { useEffect, useState } from "react";
// import { supabase } from "../../lib/supabaseClient";

// export default function FriendRequests() {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [errorMessage, setErrorMessage] = useState("");

//   useEffect(() => {
//     const fetchRequests = async () => {
//       try {
//         // Get the current user
//         const { data: authData, error: authError } = await supabase.auth.getUser();
//         if (authError || !authData?.user) {
//           setErrorMessage("User not found. Please log in.");
//           return;
//         }
//         const user = authData.user;

//         // We want to see requests where the logged-in user is the receiver (friend_id)
//         // and we want to embed the sender's profile from public.profiles via 'fk_user'
//         const { data, error } = await supabase
//           .from("friends")
//           .select(`
//             id,
//             user_id,
//             friend_id,
//             fk_user(username, avatar_url)
//           `)
//           .eq("friend_id", user.id)
//           .eq("status", "pending");

//         if (error) {
//           setErrorMessage("Failed to fetch friend requests: " + error.message);
//           return;
//         }

//         // data is an array of friend-requests. For each, .fk_user is the
//         // embedded row from public.profiles for the sender (user_id).
//         setRequests(data);
//       } catch (err) {
//         setErrorMessage("Unexpected error: " + err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchRequests();
//   }, []);

//   const handleAction = async (id, accept) => {
//     try {
//       if (accept) {
//         await supabase.from("friends").update({ status: "accepted" }).eq("id", id);
//       } else {
//         await supabase.from("friends").delete().eq("id", id);
//       }
//       // Remove handled request from local state
//       setRequests((prev) => prev.filter((r) => r.id !== id));
//     } catch (err) {
//       console.error("Error processing friend request:", err);
//     }
//   };

//   if (loading) {
//     return <div className="p-4 text-center">Loading friend requests...</div>;
//   }

//   if (errorMessage) {
//     return <div className="p-4 text-center text-red-600">{errorMessage}</div>;
//   }

//   if (requests.length === 0) {
//     return <div className="p-4 text-center">No friend requests.</div>;
//   }

//   return (
//     <div className="space-y-3">
//       {requests.map((req) => (
//         <div key={req.id} className="flex items-center justify-between p-3 border rounded-lg">
//           <div className="flex items-center gap-3">
//             <img
//               src={req.fk_user?.avatar_url || "/rascal-fallback.png"}
//               alt="Friend avatar"
//               className="w-10 h-10 rounded-full object-cover"
//             />
//             <span>{req.fk_user?.username || "Unknown"}</span>
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
         // .from("friends")
         // .select("id, user_id, profiles:profiles!friends_user_id_fkey(username, avatar_url)")
         // .eq("friend_id", currentUser.id)
         // .eq("status", "pending");
         .from("friends")
         .select("id, user_id, profile:fk_user_id(username, avatar_url)")
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
               src={req.profile?.avatar_url || "/rascal-fallback.png"}
               className="w-10 h-10 rounded-full object-cover"
             />
             <span>{req.profile?.username || "Unknown"}</span>
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