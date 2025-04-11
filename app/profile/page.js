





"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import FindFriends from "../components/FindFriends";
import FriendRequests from "../components/FriendRequests";
import FriendList from "../components/FriendList";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ username: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const [showFindFriends, setShowFindFriends] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [incomingCount, setIncomingCount] = useState(0);
  const [showFriends, setShowFriends] = useState(false);
  const router = useRouter();

  const refreshIncomingRequests = async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from("friends")
      .select("*")
      .eq("friend_id", profile.id)
      .eq("status", "pending");

    if (!error) setIncomingCount(data.length);
  };

  
  
  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.warn("❌ No user found:", userError);
        setLoading(false);
        return;
      }
      
  
      setUser(user);
  
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
  
      if (!error) {
        setProfile(profile);
        setFormData({
          username: profile.username || "",
          bio: profile.bio || "",
        });
      }
  
      setLoading(false);
    };
  
    getProfile();
  }, []);
  

  useEffect(() => {
    if (profile) {
      refreshIncomingRequests();
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const updates = {
      id: user.id,
      username: formData.username,
      bio: formData.bio,
    };

    const { error } = await supabase.from("profiles").upsert(updates);

    if (!error) {
      alert("Profile updated ✅");
      router.push("/");
    } else {
      console.error(error);
      alert("Something went wrong ❌\n\n" + error.message);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      alert("Upload failed ❌\n\n" + uploadError.message);
      console.error(uploadError);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (updateError) {
      alert("Could not update avatar ❌");
      console.error(updateError);
    } else {
      alert("Profile picture updated ✅");
      router.refresh();
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="relative inline-block">
        <img
          src={profile?.avatar_url || "/rascal-fallback.png"}
          alt="Profile"
          className="w-24 h-24 rounded-full border-4 border-pink-400 mb-4 object-cover"
        />
        {incomingCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </div>

      <label className="mt-2 text-sm text-pink-700 font-medium">
        Change profile picture
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="block w-full text-sm mt-1 text-gray-600"
        />
      </label>

      <h1 className="text-3xl font-bold text-gray-800 my-4">Your Profile</h1>

      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-md">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Username
        </label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="mb-4 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bio
        </label>
        <textarea
          name="bio"
          rows={3}
          value={formData.bio}
          onChange={handleChange}
          className="mb-4 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
        />

        <button
          onClick={() => setShowFindFriends(true)}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition"
        >
          🔍 Find Friends
        </button>
        <button
          onClick={() => setShowRequests(true)}
          className="relative mt-4 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-semibold py-2 px-4 rounded-xl transition"
        >
          👥 Requests
          {incomingCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center">
              {incomingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowFriends(true)}
          className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl transition"
        >
          🧑‍🤝‍🧑 My Friends
        </button>
        <button
          onClick={() => router.push("/submit")}
          className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          📤 Submit a Recipe
        </button>
        <button
          onClick={handleSave}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Save Changes
        </button>
      </div>

      {showFindFriends && (
        <FindFriends currentUser={profile} onClose={() => setShowFindFriends(false)} />
      )}

      {/* {showFriends && (
        <FriendList currentUser={profile} onClose={() => setShowFriends(false)} />
      )} */}
      {showFriends && (
        // <FriendList currentUser={profile} onClose={() => setShowFriends(false)} />
        <FriendList currentUser={profile} onClose={() => setShowFriends(false)} />
      )}

      {showRequests && profile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowRequests(false)}
              className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">👥 Friend Requests</h2>
            {incomingCount === 0 ? (
              <p className="text-center text-gray-500">No new requests</p>
            ) : (
              <FriendRequests
                currentUser={profile}
                onClose={() => {
                  setShowRequests(false);
                  refreshIncomingRequests();
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// "use client";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "../../lib/supabaseClient";
// import FindFriends from "../components/FindFriends";
// import FriendRequests from "../components/FriendRequests";
// import FriendList from "../components/FriendList";

// export default function ProfilePage() {
//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [formData, setFormData] = useState({ username: "", bio: "" });
//   const [loading, setLoading] = useState(true);
//   const [showFindFriends, setShowFindFriends] = useState(false);
//   const [showRequests, setShowRequests] = useState(false);
//   const [incomingCount, setIncomingCount] = useState(0);
//   const [showFriends, setShowFriends] = useState(false);
//   const router = useRouter();

//   const refreshIncomingRequests = async () => {
//     if (!profile) return;
//     const { data, error } = await supabase
//       .from("friends")
//       .select("*")
//       .eq("friend_id", profile.id)
//       .eq("status", "pending");

//     if (!error && data) {
//       setIncomingCount(data.length);
//     }
//   };

//   useEffect(() => {
//     const getProfile = async () => {
//       try {
//         // Fetch authenticated user
//         const { data, error } = await supabase.auth.getUser();
//         if (error || !data?.user) {
//           console.warn("❌ No user found:", error);
//           return;
//         }
//         setUser(data.user);

//         // Fetch the user profile using the user id
//         const { data: profileData, error: profileError } = await supabase
//           .from("profiles")
//           .select("*")
//           .eq("id", data.user.id)
//           .single();
//         if (profileError) {
//           console.error("❌ Profile fetch error:", profileError);
//         } else if (profileData) {
//           setProfile(profileData);
//           setFormData({
//             username: profileData.username || "",
//             bio: profileData.bio || "",
//           });
//         }
//       } catch (err) {
//         console.error("❌ Error in getProfile:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     getProfile();
//   }, []);

//   useEffect(() => {
//     if (profile) {
//       refreshIncomingRequests();
//     }
//   }, [profile]);

//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleSave = async () => {
//     if (!user) {
//       setLoading(false);
//       return;
//     }

//     const updates = {
//       id: user.id,
//       username: formData.username,
//       bio: formData.bio,
//     };

//     const { error } = await supabase.from("profiles").upsert(updates);
//     if (!error) {
//       alert("Profile updated ✅");
//       router.push("/");
//     } else {
//       console.error(error);
//       alert("Something went wrong ❌\n\n" + error.message);
//     }
//   };

//   const handleAvatarUpload = async (event) => {
//     const file = event.target.files[0];
//     if (!file || !user) return;

//     const fileExt = file.name.split(".").pop();
//     const filePath = `${user.id}/avatar.${fileExt}`;

//     const { error: uploadError } = await supabase.storage
//       .from("avatars")
//       .upload(filePath, file, { upsert: true });
//     if (uploadError) {
//       alert("Upload failed ❌\n\n" + uploadError.message);
//       console.error(uploadError);
//       return;
//     }

//     const { data: publicData } = supabase.storage
//       .from("avatars")
//       .getPublicUrl(filePath);

//     if (!publicData?.publicUrl) {
//       alert("Could not retrieve public URL for the uploaded avatar.");
//       return;
//     }

//     const { error: updateError } = await supabase
//       .from("profiles")
//       .update({ avatar_url: publicData.publicUrl })
//       .eq("id", user.id);

//     if (updateError) {
//       alert("Could not update avatar ❌");
//       console.error(updateError);
//     } else {
//       alert("Profile picture updated ✅");
//       router.refresh();
//     }
//   };

//   if (loading) {
//     return <div className="p-6 text-center">Loading profile...</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-6 py-12">
//       <div className="relative inline-block">
//         <img
//           src={profile?.avatar_url || "/rascal-fallback.png"}
//           alt="Profile"
//           className="w-24 h-24 rounded-full border-4 border-pink-400 mb-4 object-cover"
//         />
//         {incomingCount > 0 && (
//           <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
//         )}
//       </div>

//       <label className="mt-2 text-sm text-pink-700 font-medium">
//         Change profile picture
//         <input
//           type="file"
//           accept="image/*"
//           onChange={handleAvatarUpload}
//           className="block w-full text-sm mt-1 text-gray-600"
//         />
//       </label>

//       <h1 className="text-3xl font-bold text-gray-800 my-4">Your Profile</h1>

//       <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-md">
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Username
//         </label>
//         <input
//           type="text"
//           name="username"
//           value={formData.username}
//           onChange={handleChange}
//           className="mb-4 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
//         />

//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           Bio
//         </label>
//         <textarea
//           name="bio"
//           rows={3}
//           value={formData.bio}
//           onChange={handleChange}
//           className="mb-4 w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
//         />

//         <button
//           onClick={() => {
//             setShowFriends(false);
//             setShowRequests(false);
//             setShowFindFriends(true);
//           }}
//           className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition"
//         >
//           🔍 Find Friends
//         </button>
//         <button
//           onClick={() => {
//             setShowFriends(false);
//             setShowFindFriends(false);
//             setShowRequests(true);
//           }}
//           className="relative mt-4 bg-yellow-300 hover:bg-yellow-400 text-yellow-900 font-semibold py-2 px-4 rounded-xl transition"
//         >
//           👥 Requests
//           {incomingCount > 0 && (
//             <span className="absolute -top-2 -right-2 bg-red-500 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center">
//               {incomingCount}
//             </span>
//           )}
//         </button>
//         <button
//           onClick={() => {
//             setShowFindFriends(false);
//             setShowRequests(false);
//             setShowFriends(true);
//           }}
//           className="mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-xl transition"
//         >
//           🧑‍🤝‍🧑 My Friends
//         </button>
//         <button
//           onClick={() => router.push("/submit")}
//           className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
//         >
//           📤 Submit a Recipe
//         </button>
//         <button
//           onClick={handleSave}
//           className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition"
//         >
//           Save Changes
//         </button>
//       </div>

//       {showFindFriends && (
//         <FindFriends
//           currentUser={profile}
//           onClose={() => setShowFindFriends(false)}
//         />
//       )}

//       {showFriends && (
//         <FriendList
//           currentUser={profile}
//           onClose={() => setShowFriends(false)}
//         />
//       )}

//       {showRequests && profile && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
//           <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
//             <button
//               onClick={() => setShowRequests(false)}
//               className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-xl"
//             >
//               ✕
//             </button>
//             <h2 className="text-xl font-bold mb-4">👥 Friend Requests</h2>
//             {incomingCount === 0 ? (
//               <p className="text-center text-gray-500">
//                 No new requests
//               </p>
//             ) : (
//               <FriendRequests
//                 currentUser={profile}
//                 onClose={() => {
//                   setShowRequests(false);
//                   refreshIncomingRequests();
//                 }}
//               />
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
