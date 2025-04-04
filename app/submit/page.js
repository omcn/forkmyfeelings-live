// "use client";

// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { supabase } from "../../lib/supabaseClient";
// // import Filter from "bad-words";
// // const Filter = require("bad-words");
// // import BadWordsFilter from "bad-words";
// // const Filter = BadWordsFilter;
// let Filter;
// if (typeof window !== "undefined") {
//   Filter = require("bad-words");
// }



// export default function SubmitRecipePage() {
//   const router = useRouter();
//   const [user, setUser] = useState(null);
//   const [form, setForm] = useState({
//     name: "",
//     description: "",
//     ingredients: "",
//     steps: "",
//     moods: "",
//   });
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchUser = async () => {
//       const { data } = await supabase.auth.getUser();
//       if (data?.user) setUser(data.user);
//     };
//     fetchUser();
//   }, []);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError("");

//     const filter = new Filter();
//     const allText = Object.values(form).join(" ");
//     if (filter.isProfane(allText)) {
//       setError("🚫 nice try buddy, keep it fsmily friendly.");
//       return;
//     }

//     if (
//       form.name.length < 5 ||
//       form.ingredients.split("\n").length < 2 ||
//       form.steps.split("\n").length < 2
//     ) {
//       setError("Please provide a real recipe with enough detail.");
//       return;
//     }

//     const { error } = await supabase.from("recipes").insert({
//       name: form.name.trim(),
//       description: form.description.trim(),
//       ingredients: form.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
//       steps: form.steps.split("\n").map((s) => s.trim()).filter(Boolean),
//       moods: form.moods.split(",").map((m) => m.trim().toLowerCase()).filter(Boolean),
//       user_id: user.id,
//       status: "pending",
//     });

//     if (error) {
//       console.error(error);
//       setError("Something went wrong. Try again.");
//     } else {
//       router.push("/?submitted=true");
//     }
//   };

//   if (!user) {
//     return <div className="p-6 text-center">Please log in to submit a recipe.</div>;
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center p-6">
//       <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">Submit a Recipe</h1>

//       <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-xl space-y-4">
//         <input
//           type="text"
//           name="name"
//           placeholder="Recipe name"
//           value={form.name}
//           onChange={handleChange}
//           className="w-full border rounded-md p-2"
//           required
//         />
//         <textarea
//           name="description"
//           placeholder="Short description"
//           value={form.description}
//           onChange={handleChange}
//           className="w-full border rounded-md p-2"
//         />
//         <textarea
//           name="ingredients"
//           placeholder="Ingredients (one per line)"
//           value={form.ingredients}
//           onChange={handleChange}
//           className="w-full border rounded-md p-2"
//           required
//         />
//         <textarea
//           name="steps"
//           placeholder="Steps (one per line)"
//           value={form.steps}
//           onChange={handleChange}
//           className="w-full border rounded-md p-2"
//           required
//         />
//         <input
//           type="text"
//           name="moods"
//           placeholder="Related moods (comma-separated)"
//           value={form.moods}
//           onChange={handleChange}
//           className="w-full border rounded-md p-2"
//         />

//         {error && <p className="text-red-500 text-sm">{error}</p>}

//         <button
//           type="submit"
//           className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl"
//         >
//           Submit for Review
//         </button>
//       </form>
//     </div>
//   );
// }
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";

// 🔐 Custom Profanity Filter
export const extremeBadWords = [
    "anal", "anus", "assclown", "assfuck", "assfucker", "asshat", "asshole", "asslicker", "assmunch", "asspirate",
    "ballsack", "bastard", "bastardo", "beaner", "bitch", "bitchass", "bitchtits", "blowjob", "boob", "boobs",
    "cameltoe", "chink", "clit", "clitoris", "cock", "cockbite", "cockface", "cockhead", "cocksucker", "coon",
    "cum", "cumdumpster", "cumshot", "cumslut", "cunt", "deepthroat", "dick", "dickbag", "dickhead", "dickwad",
    "dickweed", "dipshit", "dildo", "dyke", "fag", "faggot", "fingering", "fuck", "fuckface", "fuckhole",
    "fucker", "fucking", "fuckstick", "goddamn", "gook", "handjob", "hell", "hoe", "hooker", "jackass", "jew",
    "jiggaboo", "jizz", "jizzed", "jizzum", "kike", "molest", "molestation", "molester", "motherfucker",
    "motherfucking", "nigga", "nigger", "numbnuts", "paki", "porchmonkey", "prick", "pussy", "pussies",
    "rape", "rapist", "rimjob", "sandnigger", "scumbag", "shit", "shitbag", "shitbrain", "shitfucker",
    "shitlord", "shitsucker", "shitstain", "shitty", "slant", "slut", "spic", "tarbaby", "titty", "titties",
    "tranny", "twat", "twatwaffle", "wanker", "wetback", "whore", "zipperhead"
  ];
  
  
  const profanePattern = new RegExp(
    extremeBadWords
      .map(word => word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').split('').join('[^a-zA-Z0-9]{0,2}'))
      .join('|'),
    'i'
  );

  function containsProfanity(text) {
    return profanePattern.test(text.toLowerCase());
  }

export default function SubmitRecipePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    ingredients: "",
    steps: "",
    moods: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const allText = Object.values(form).join(" ");
    if (containsProfanity(allText)) {
      setError("🚫 Nice try buddy, keep it family friendly.");
      return;
    }
    

    if (
      form.name.length < 5 ||
      form.ingredients.split("\n").length < 2 ||
      form.steps.split("\n").length < 2
    ) {
      setError("Please provide a real recipe with enough detail.");
      return;
    }

    const { error } = await supabase.from("recipes").insert({
      name: form.name.trim(),
      description: form.description.trim(),
      ingredients: form.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
      steps: form.steps.split("\n").map((s) => s.trim()).filter(Boolean),
      moods: form.moods.split(",").map((m) => m.trim().toLowerCase()).filter(Boolean),
      user_id: user.id,
      status: "pending",
    });

    if (error) {
      console.error(error);
      setError("Something went wrong. Try again.");
    } else {
      router.push("/?submitted=true");
    }
  };

  if (!user) {
    return <div className="p-6 text-center">Please log in to submit a recipe.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center p-6">
        <button
            onClick={() => router.push("/")}
            className="absolute top-4 left-4 bg-white text-pink-500 border border-pink-300 hover:bg-pink-100 font-semibold py-1 px-3 rounded-lg shadow-sm transition"
            >
            ← Back
            </button>
      <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">Submit a Recipe</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-xl space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Recipe name"
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded-md p-2"
          required
        />
        <textarea
          name="description"
          placeholder="Short description"
          value={form.description}
          onChange={handleChange}
          className="w-full border rounded-md p-2"
        />
        <textarea
          name="ingredients"
          placeholder="Ingredients (one per line)"
          value={form.ingredients}
          onChange={handleChange}
          className="w-full border rounded-md p-2"
          required
        />
        <textarea
          name="steps"
          placeholder="Steps (one per line)"
          value={form.steps}
          onChange={handleChange}
          className="w-full border rounded-md p-2"
          required
        />
        <input
          type="text"
          name="moods"
          placeholder="Related moods (comma-separated)"
          value={form.moods}
          onChange={handleChange}
          className="w-full border rounded-md p-2"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-xl"
        >
          Submit for Review
        </button>
      </form>
    </div>
  );
}

