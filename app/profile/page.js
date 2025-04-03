

// "use client";
// import { useEffect, useState } from "react";
// import { supabase } from "../../lib/supabaseClient";
// import { useRouter } from "next/navigation";


// export default function ProfilePage() {
//   const router = useRouter();

//   const [user, setUser] = useState(null);
//   const [profile, setProfile] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [formData, setFormData] = useState({
//     username: "",
//     bio: "",
//   });

//   // Load auth user + profile
//   useEffect(() => {
//     const fetchUserAndProfile = async () => {
//       const { data: authData } = await supabase.auth.getUser();
//       const user = authData?.user;
//       setUser(user);

//       if (user) {
//         const { data, error } = await supabase
//           .from("profiles")
//           .select("*")
//           .eq("id", user.id)
//           .single();

//         if (!error && data) {
//           setProfile(data);
//           setFormData({
//             username: data.username || "",
//             bio: data.bio || "",
//           });
//         }
//       }

//       setLoading(false);
//     };

//     fetchUserAndProfile();
//   }, []);

//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleSave = async () => {
//     if (!user) return;

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
//       alert("Something went wrong ❌");
//       console.error("Supabase Error:", error);
//       alert("Something went wrong ❌\n\n" + error.message);
//     }
//   };

//   if (loading) {
//     return <div className="p-6 text-center">Loading profile...</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-6 py-12">
//       <img
//         src={profile?.avatar_url || "/rascal-fallback.png"}
//         alt="Profile"
//         className="w-24 h-24 rounded-full border-4 border-pink-400 mb-4 object-cover"
//       />
//       <h1 className="text-3xl font-bold text-gray-800 mb-4">Your Profile</h1>

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
//           onClick={handleSave}
//           className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition"
//         >
//           Save Changes
//         </button>
//       </div>
//     </div>
//   );
// }

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ username: "", bio: "" });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!error && data) {
          setProfile(data);
          setFormData({
            username: data.username || "",
            bio: data.bio || "",
          });
        }
      }

      setLoading(false);
    };

    fetchUserAndProfile();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    const updates = {
      id: user.id,
      username: formData.username,
      bio: formData.bio,
    };

    const { error } = await supabase.from("profiles").upsert(updates);

    if (!error) {
      alert("Profile updated ✅");
      router.push("/"); // 👈 Go back to main app
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
        console.error("Upload error:", uploadError);
        alert("Upload failed ❌\n\n" + uploadError.message);
      alert("Upload failed ❌");
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
      router.refresh(); // refresh to show new avatar
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center px-6 py-12">
      <img
        src={profile?.avatar_url || "/rascal-fallback.png"}
        alt="Profile"
        className="w-24 h-24 rounded-full border-4 border-pink-400 mb-4 object-cover"
      />

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
          onClick={handleSave}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}


