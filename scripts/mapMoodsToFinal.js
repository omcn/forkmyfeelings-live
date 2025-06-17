import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_KEY);

// Map old moods to new final 10
const moodMap = {
  anxious: "overwhelmed",
  tired: "tired",
  happy: "happy",
  sad: "sad",
  angry: "overwhelmed",
  lonely: "sad",
  jealous: "sad",
  excited: "happy",
  grateful: "happy",
  overwhelmed: "overwhelmed",
  breakup: "sad",
  bored: "bored",
  celebrating: "happy",
  working: "rushed",
  studying: "rushed",
  raining: "nostalgic",
  sunny: "happy",
  hungover: "recovering",
  traveling: "rushed",
  "date-night": "date-night",
  lazy: "tired",
  energetic: "happy",
  restless: "overwhelmed",
  focused: "rushed",
  "burnt-out": "overwhelmed",
  motivated: "happy",
  wired: "overwhelmed",
  calm: "chill",
  chill: "chill",
  exhausted: "tired"
};

const allowedMoods = [
  "tired", "happy", "sad", "rushed", "date-night",
  "chill", "recovering", "bored", "nostalgic", "overwhelmed"
];

async function updateMoods() {
  const { data: recipes, error } = await supabase.from("recipes").select("*");

  if (error) {
    console.error("Error fetching recipes:", error.message);
    return;
  }

  for (const recipe of recipes) {
    let originalMoods;

    try {
      originalMoods = typeof recipe.moods === "string"
        ? JSON.parse(recipe.moods)
        : recipe.moods;
    } catch (err) {
      console.warn(`❌ Could not parse moods for recipe ID ${recipe.id}`);
      continue;
    }

    const remapped = [...new Set(
      originalMoods
        .map((m) => moodMap[m])
        .filter((m) => allowedMoods.includes(m))
    )];

    if (remapped.length === 0) {
      console.warn(`⚠️ No valid moods for recipe ID ${recipe.id}. Skipping update.`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("recipes")
      .update({ moods: remapped })
      .eq("id", recipe.id);

    if (updateError) {
      console.error(`❌ Failed to update recipe ${recipe.id}:`, updateError.message);
    } else {
      console.log(`✅ Updated recipe ${recipe.id} → ${JSON.stringify(remapped)}`);
    }
  }

  console.log("🎉 Mood remapping complete.");
}

updateMoods();
