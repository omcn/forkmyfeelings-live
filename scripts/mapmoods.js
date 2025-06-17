const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
dotenv.config();


const supabase = createClient("https://xgtfroidkczkebrjmcly.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhndGZyb2lka2N6a2VicmptY2x5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MzM3Nzc1MywiZXhwIjoyMDU4OTUzNzUzfQ.VdFSMtqkuv24oCvl-MeLkas2TLOxQXaft-SDn5AagUQ");

const emojiToMood = {
  "😴": "tired",
  "😊": "happy",
  "😢": "sad",
  "⏰": "rushed",
  "💘": "date-night",
  "🧊": "chill",
  "🛌": "recovering",
  "😐": "bored",
  "🕰️": "nostalgic",
  "😵‍💫": "overwhelmed"
};

async function updateMoods() {
  const { data: recipes, error } = await supabase.from("recipes").select("id, emoji");

  if (error) {
    console.error("Failed to fetch recipes:", error.message);
    return;
  }

  for (const recipe of recipes) {
    const mood = emojiToMood[recipe.emoji];
    if (!mood) continue;

    const { error: updateError } = await supabase
      .from("recipes")
      .update({ moods: JSON.stringify([mood]) }) // assuming 'moods' is an array
      .eq("id", recipe.id);

    if (updateError) {
      console.error(`❌ Failed to update recipe ${recipe.id}:`, updateError.message);
    } else {
      console.log(`✅ Updated recipe ${recipe.id} → [${mood}]`);
    }
  }
  console.log("Updating recipe ID:", recipe.id, "→ New moods:", newMoods);

    const { error: updateError } = await supabase
    .from("recipes")
    .update({ moods: newMoods })
    .eq("id", recipe.id);

    if (error) {
    console.error("❌ Failed to update recipe ID", recipe.id, error.message);
    } else {
    console.log("✅ Updated recipe ID", recipe.id);
    }


  console.log("🎉 Done updating moods.");
}

updateMoods();
