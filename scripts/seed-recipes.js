#!/usr/bin/env node

/**
 * Recipe Seed Script for ForkMyFeelings
 *
 * Reads recipes from scripts/recipes.json and inserts them into Supabase.
 *
 * Usage:
 *   node scripts/seed-recipes.js            # Insert recipes
 *   node scripts/seed-recipes.js --dry-run   # Validate only, no insert
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const fs = require("fs");
const path = require("path");

// Load env vars from .env.local or .env
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { createClient } = require("@supabase/supabase-js");

const BATCH_SIZE = 25;

const ALLOWED_MOODS = [
  "happy",
  "sad",
  "anxious",
  "stressed",
  "tired",
  "sleepy",
  "excited",
  "energetic",
  "calm",
  "peaceful",
  "romantic",
  "flirty",
  "bored",
  "curious",
  "adventurous",
  "nostalgic",
  "angry",
  "hangry",
  "focused",
  "productive",
  "social",
  "celebrating",
  "lonely",
  "lazy",
  "date-night",
  "chill",
  "overwhelmed",
  "recovering",
  "rushed",
];

const DRY_RUN = process.argv.includes("--dry-run");

function validateRecipe(recipe, index) {
  const errors = [];
  const prefix = `Recipe #${index + 1} ("${recipe.name || "unnamed"}")`;

  if (!recipe.name || typeof recipe.name !== "string") {
    errors.push(`${prefix}: missing or invalid "name"`);
  }
  if (!recipe.emoji || typeof recipe.emoji !== "string") {
    errors.push(`${prefix}: missing or invalid "emoji"`);
  }
  if (!recipe.description || typeof recipe.description !== "string") {
    errors.push(`${prefix}: missing or invalid "description"`);
  }
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push(`${prefix}: "ingredients" must be a non-empty array`);
  } else {
    recipe.ingredients.forEach((ing, i) => {
      if (typeof ing !== "string") {
        errors.push(`${prefix}: ingredient #${i + 1} is not a string`);
      }
    });
  }
  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    errors.push(`${prefix}: "steps" must be a non-empty array`);
  } else {
    recipe.steps.forEach((step, i) => {
      if (typeof step !== "string") {
        errors.push(`${prefix}: step #${i + 1} is not a string`);
      }
    });
  }
  if (!Array.isArray(recipe.moods) || recipe.moods.length === 0) {
    errors.push(`${prefix}: "moods" must be a non-empty array`);
  } else {
    recipe.moods.forEach((mood) => {
      if (!ALLOWED_MOODS.includes(mood)) {
        errors.push(`${prefix}: invalid mood "${mood}". Allowed: ${ALLOWED_MOODS.join(", ")}`);
      }
    });
  }

  return errors;
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN MODE ===" : "=== SEEDING RECIPES ===");

  // Load recipes
  const recipesPath = path.resolve(__dirname, "recipes.json");
  if (!fs.existsSync(recipesPath)) {
    console.error(`Error: ${recipesPath} not found`);
    process.exit(1);
  }

  let recipes;
  try {
    recipes = JSON.parse(fs.readFileSync(recipesPath, "utf-8"));
  } catch (err) {
    console.error(`Error parsing recipes.json: ${err.message}`);
    process.exit(1);
  }

  if (!Array.isArray(recipes)) {
    console.error("Error: recipes.json must be a JSON array");
    process.exit(1);
  }

  console.log(`Found ${recipes.length} recipes in recipes.json`);

  // Validate all recipes
  const allErrors = [];
  recipes.forEach((recipe, i) => {
    const errors = validateRecipe(recipe, i);
    allErrors.push(...errors);
  });

  if (allErrors.length > 0) {
    console.error(`\nValidation failed with ${allErrors.length} error(s):`);
    allErrors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  console.log("All recipes passed validation.\n");

  if (DRY_RUN) {
    console.log("Dry run complete. No records inserted.");
    process.exit(0);
  }

  // Connect to Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Prepare rows
  const rows = recipes.map((r) => ({
    name: r.name,
    emoji: r.emoji,
    description: r.description,
    ingredients: r.ingredients,
    steps: r.steps,
    moods: r.moods,
    status: r.status || "approved",
    user_id: r.user_id || null,
  }));

  // Insert in batches
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from("recipes")
      .upsert(batch, { onConflict: "name", ignoreDuplicates: true })
      .select();

    if (error) {
      console.error(`Error inserting batch at index ${i}: ${error.message}`);
      process.exit(1);
    }

    const batchInserted = data ? data.length : 0;
    const batchSkipped = batch.length - batchInserted;
    inserted += batchInserted;
    skipped += batchSkipped;

    console.log(
      `Inserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} recipes...`
    );
  }

  console.log(
    `\nDone! ${inserted} recipes inserted, ${skipped} duplicates skipped.`
  );
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
