"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import toast from "react-hot-toast";

const VALID_MOODS = [
  "tired", "happy", "sad", "rushed", "date-night", "chill",
  "recovering", "bored", "nostalgic", "overwhelmed",
];

let _filter = null;
function getFilter() {
  if (!_filter) {
    try {
      const Filter = require("bad-words");
      _filter = new Filter();
    } catch {
      _filter = { isProfane: () => false };
    }
  }
  return _filter;
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
    emoji: "🍽️",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) setUser(data.user);
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: null }));
    }
  };

  const validate = useCallback(() => {
    const e = {};
    const name = form.name.trim();
    const desc = form.description.trim();
    const ingredients = form.ingredients.split("\n").map((s) => s.trim()).filter(Boolean);
    const steps = form.steps.split("\n").map((s) => s.trim()).filter(Boolean);
    const moods = form.moods.split(",").map((m) => m.trim().toLowerCase()).filter(Boolean);

    if (name.length < 3) e.name = "Recipe name must be at least 3 characters.";
    if (name.length > 100) e.name = "Recipe name is too long (max 100 chars).";
    if (desc.length > 500) e.description = "Description is too long (max 500 chars).";
    if (ingredients.length < 2) e.ingredients = "Please list at least 2 ingredients.";
    if (ingredients.length > 50) e.ingredients = "Too many ingredients (max 50).";
    if (steps.length < 2) e.steps = "Please list at least 2 steps.";
    if (steps.length > 30) e.steps = "Too many steps (max 30).";

    const invalidMoods = moods.filter((m) => !VALID_MOODS.includes(m));
    if (invalidMoods.length > 0) {
      e.moods = `Invalid mood(s): ${invalidMoods.join(", ")}. Valid: ${VALID_MOODS.join(", ")}`;
    }
    if (moods.length === 0) e.moods = "Please select at least one mood.";

    const allText = [name, desc, ...ingredients, ...steps].join(" ");
    try {
      if (getFilter().isProfane(allText)) {
        e.name = e.name || "Please keep it family friendly.";
      }
    } catch {}

    return e;
  }, [form]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const now = Date.now();
    if (now - lastSubmitTime < 30000) {
      toast.error("Please wait before submitting again.");
      return;
    }

    if (!user?.id) {
      toast.error("Please log in to submit a recipe.");
      return;
    }

    setSubmitting(true);
    setErrors({});

    const { error } = await supabase.from("recipes").insert({
      name: form.name.trim(),
      emoji: form.emoji || "🍽️",
      description: form.description.trim(),
      ingredients: form.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
      steps: form.steps.split("\n").map((s) => s.trim()).filter(Boolean),
      moods: form.moods.split(",").map((m) => m.trim().toLowerCase()).filter(Boolean),
      user_id: user.id,
      status: "pending",
    });

    if (error) {
      console.error(error);
      toast.error("Something went wrong. Try again.");
    } else {
      setLastSubmitTime(now);
      toast.success("Recipe submitted for review!");
      router.push("/?submitted=true");
    }
    setSubmitting(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex items-center justify-center p-6">
        <p className="text-gray-600">Please log in to submit a recipe.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-100 to-orange-100 flex flex-col items-center justify-center p-6">
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 bg-white text-pink-500 border border-pink-300 hover:bg-pink-100 font-semibold py-1 px-3 rounded-lg shadow-sm transition"
      >
        &larr; Back
      </button>
      <h1 className="text-3xl font-bold mb-4 text-center text-gray-800">Submit a Recipe</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-xl space-y-4">
        <div>
          <input
            type="text"
            name="name"
            placeholder="Recipe name"
            value={form.name}
            onChange={handleChange}
            className={`w-full border rounded-md p-2 ${errors.name ? "border-red-400" : ""}`}
            required
            maxLength={100}
            aria-label="Recipe name"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <input
            type="text"
            name="emoji"
            placeholder="Emoji (e.g. 🍕)"
            value={form.emoji}
            onChange={handleChange}
            className="w-full border rounded-md p-2"
            maxLength={4}
            aria-label="Recipe emoji"
          />
        </div>

        <div>
          <textarea
            name="description"
            placeholder="Short description"
            value={form.description}
            onChange={handleChange}
            className={`w-full border rounded-md p-2 ${errors.description ? "border-red-400" : ""}`}
            maxLength={500}
            rows={2}
            aria-label="Description"
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        <div>
          <textarea
            name="ingredients"
            placeholder="Ingredients (one per line)"
            value={form.ingredients}
            onChange={handleChange}
            className={`w-full border rounded-md p-2 ${errors.ingredients ? "border-red-400" : ""}`}
            required
            rows={4}
            aria-label="Ingredients, one per line"
          />
          {errors.ingredients && <p className="text-red-500 text-xs mt-1">{errors.ingredients}</p>}
        </div>

        <div>
          <textarea
            name="steps"
            placeholder="Steps (one per line)"
            value={form.steps}
            onChange={handleChange}
            className={`w-full border rounded-md p-2 ${errors.steps ? "border-red-400" : ""}`}
            required
            rows={4}
            aria-label="Steps, one per line"
          />
          {errors.steps && <p className="text-red-500 text-xs mt-1">{errors.steps}</p>}
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Moods (comma-separated): {VALID_MOODS.join(", ")}
          </label>
          <input
            type="text"
            name="moods"
            placeholder="e.g. happy, chill, date-night"
            value={form.moods}
            onChange={handleChange}
            className={`w-full border rounded-md p-2 ${errors.moods ? "border-red-400" : ""}`}
            aria-label="Related moods, comma-separated"
          />
          {errors.moods && <p className="text-red-500 text-xs mt-1">{errors.moods}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-xl transition"
        >
          {submitting ? "Submitting..." : "Submit for Review"}
        </button>
      </form>
    </div>
  );
}
