// "use client";
// import { useState } from "react";
// import { supabase } from "../../lib/supabaseClient";

// export default function AuthForm({ onAuthSuccess }) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [isLogin, setIsLogin] = useState(true);
//   const [error, setError] = useState("");

  
//   const handleAuth = async (e) => {
//     e.preventDefault();
//     setError("");
  
//     const { data, error: authError } = isLogin
//       ? await supabase.auth.signInWithPassword({ email, password })
//       : await supabase.auth.signUp({ email, password });
  
//     if (authError) {
//       setError(authError.message);
//       return;
//     }
  
//     // ✅ Handle post-signup profile creation
//     if (!isLogin) {
//       const userId = data?.user?.id || data?.session?.user?.id;
//       const userEmail = data?.user?.email || data?.session?.user?.email;
  
//       if (userId && userEmail) {
//         const { error: profileError } = await supabase.from("profiles").upsert({
//           id: userId,
//           email: userEmail,
//           username: "",
//           bio: "",
//         });
  
//         if (profileError) {
//           setError("Profile creation failed: " + profileError.message);
//           return;
//         }
//       }
//     }
  
//     onAuthSuccess?.(data);
//   };
  
  

//   return (
//     <form
//       onSubmit={handleAuth}
//       className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
//     >
//       <h2 className="text-xl font-bold text-gray-800">
//         {isLogin ? "Log In" : "Sign Up"}
//       </h2>

//       <input
//         type="email"
//         placeholder="Email"
//         className="w-full border border-gray-300 px-3 py-2 rounded-md"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         required
//       />
//       <input
//         type="password"
//         placeholder="Password"
//         className="w-full border border-gray-300 px-3 py-2 rounded-md"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         required
//       />

//       {error && <p className="text-red-500 text-sm">{error}</p>}

//       <button
//         type="submit"
//         className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-md"
//       >
//         {isLogin ? "Log In" : "Sign Up"}
//       </button>

//       <p
//         className="text-sm text-center text-pink-600 cursor-pointer"
//         onClick={() => setIsLogin(!isLogin)}
//       >
//         {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
//       </p>
//     </form>
//   );
// }

// import { useEffect } from "react";
// import { supabase } from "../lib/supabaseClient";

// export default function SupabaseAuthWatcher() {
//   useEffect(() => {
//     const { data: listener } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         if (event === "SIGNED_IN" && session?.user) {
//           const user = session.user;

//           // Create profile only if not exists
//           const { data: existing } = await supabase
//             .from("profiles")
//             .select("id")
//             .eq("id", user.id)
//             .single();

//           if (!existing) {
//             await supabase.from("profiles").insert({
//               id: user.id,
//               email: user.email,
//               username: "",
//               bio: "",
//             });
//           }
//         }
//       }
//     );

//     return () => listener?.subscription?.unsubscribe();
//   }, []);

//   return null;
// }
"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function AuthForm({ onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");

    const { data, error: authError } = isLogin
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      return;
    }

    onAuthSuccess?.(data);
  };

  return (
    <form
      onSubmit={handleAuth}
      className="bg-white p-6 rounded-xl shadow-md w-full max-w-md space-y-4"
    >
      <h2 className="text-xl font-bold text-gray-800">
        {isLogin ? "Log In" : "Sign Up"}
      </h2>

      <input
        type="email"
        placeholder="Email"
        className="w-full border border-gray-300 px-3 py-2 rounded-md"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full border border-gray-300 px-3 py-2 rounded-md"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 rounded-md"
      >
        {isLogin ? "Log In" : "Sign Up"}
      </button>

      <p
        className="text-sm text-center text-pink-600 cursor-pointer"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
      </p>
    </form>
  );
}


