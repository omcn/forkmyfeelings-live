"use client";
import { useState } from "react";

export default function RecipeSubmissionForm({ onSubmit }) {
  const [moods, setMoods] = useState([""]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");

  const handleMoodChange = (index, value) => {
    const updated = [...moods];
    updated[index] = value;
    setMoods(updated);
  };

  const addMood = () => {
    if (moods.length < 3) setMoods([...moods, ""]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const formattedSteps = steps
      .split("\n")
      .map((step) => step.trim())
      .filter(Boolean);

    const newRecipe = {
      name,
      description,
      moods,
      emoji: "👤", // Placeholder or user-selected later
      steps: formattedSteps,
      userSubmitted: true,
    };

    onSubmit(newRecipe);
    // Reset form
    setMoods([""]);
    setName("");
    setDescription("");
    setSteps("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-md max-w-md w-full">
      <h2 className="text-xl font-bold text-gray-800">Submit Your Recipe</h2>

      {moods.map((mood, index) => (
        <input
          key={index}
          type="text"
          value={mood}
          onChange={(e) => handleMoodChange(index, e.target.value)}
          placeholder={`Mood ${index + 1}`}
          className="w-full border border-gray-300 px-3 py-2 rounded-md"
        />
      ))}

      {moods.length < 3 && (
        <button
          type="button"
          onClick={addMood}
          className="text-sm text-pink-500 hover:underline"
        >
          + Add another mood
        </button>
      )}

      <input
        type="text"
        placeholder="Recipe Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border border-gray-300 px-3 py-2 rounded-md"
        required
      />

      <textarea
        placeholder="Short description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border border-gray-300 px-3 py-2 rounded-md"
        required
      />

      <textarea
        placeholder="Step-by-step instructions (one per line)"
        value={steps}
        onChange={(e) => setSteps(e.target.value)}
        className="w-full border border-gray-300 px-3 py-2 rounded-md"
        rows={4}
        required
      />

      <button
        type="submit"
        className="w-full bg-pink-500 text-white font-semibold py-2 rounded-md hover:bg-pink-600"
      >
        Submit Recipe
      </button>
    </form>
  );
}
