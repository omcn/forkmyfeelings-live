// Test the schema.org Recipe structured data generation from RecipeCard.js

function buildRecipeSchema(recipe, recipeAvgRating) {
  const ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : JSON.parse(recipe.ingredients || "[]");

  const steps = Array.isArray(recipe.steps)
    ? recipe.steps
    : JSON.parse(recipe.steps || "[]");

  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.name,
    description: recipe.description || "A mood-matched recipe from Fork My Feels",
    recipeIngredient: ingredients,
    recipeInstructions: steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: step,
    })),
    ...(recipeAvgRating !== null && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: recipeAvgRating,
        bestRating: 5,
      },
    }),
    author: { "@type": "Organization", name: "Fork My Feels" },
    datePublished: recipe.created_at || new Date().toISOString(),
    recipeCategory: "Mood-based",
  };
}

describe("Schema.org Recipe structured data", () => {
  const baseRecipe = {
    name: "Comfort Mac & Cheese",
    emoji: "🧀",
    description: "Creamy, cheesy perfection",
    ingredients: ["pasta", "cheese", "butter", "milk"],
    steps: ["Boil pasta", "Make sauce", "Combine and bake"],
    created_at: "2024-01-15T10:00:00Z",
  };

  test("has correct @context and @type", () => {
    const schema = buildRecipeSchema(baseRecipe, null);
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("Recipe");
  });

  test("includes recipe name", () => {
    const schema = buildRecipeSchema(baseRecipe, null);
    expect(schema.name).toBe("Comfort Mac & Cheese");
  });

  test("includes recipe description", () => {
    const schema = buildRecipeSchema(baseRecipe, null);
    expect(schema.description).toBe("Creamy, cheesy perfection");
  });

  test("uses fallback description when none provided", () => {
    const recipe = { ...baseRecipe, description: undefined };
    const schema = buildRecipeSchema(recipe, null);
    expect(schema.description).toBe("A mood-matched recipe from Fork My Feels");
  });

  test("includes ingredients as array", () => {
    const schema = buildRecipeSchema(baseRecipe, null);
    expect(schema.recipeIngredient).toEqual(["pasta", "cheese", "butter", "milk"]);
  });

  test("parses JSON string ingredients", () => {
    const recipe = { ...baseRecipe, ingredients: '["flour","sugar"]' };
    const schema = buildRecipeSchema(recipe, null);
    expect(schema.recipeIngredient).toEqual(["flour", "sugar"]);
  });

  test("formats steps as HowToStep objects", () => {
    const schema = buildRecipeSchema(baseRecipe, null);
    expect(schema.recipeInstructions).toHaveLength(3);
    expect(schema.recipeInstructions[0]).toEqual({
      "@type": "HowToStep",
      position: 1,
      text: "Boil pasta",
    });
    expect(schema.recipeInstructions[2]).toEqual({
      "@type": "HowToStep",
      position: 3,
      text: "Combine and bake",
    });
  });

  test("includes aggregateRating when rating is provided", () => {
    const schema = buildRecipeSchema(baseRecipe, 4.2);
    expect(schema.aggregateRating).toEqual({
      "@type": "AggregateRating",
      ratingValue: 4.2,
      bestRating: 5,
    });
  });

  test("omits aggregateRating when rating is null", () => {
    const schema = buildRecipeSchema(baseRecipe, null);
    expect(schema.aggregateRating).toBeUndefined();
  });

  test("includes author as Fork My Feels", () => {
    const schema = buildRecipeSchema(baseRecipe, null);
    expect(schema.author).toEqual({
      "@type": "Organization",
      name: "Fork My Feels",
    });
  });

  test("uses recipe created_at as datePublished", () => {
    const schema = buildRecipeSchema(baseRecipe, null);
    expect(schema.datePublished).toBe("2024-01-15T10:00:00Z");
  });

  test("falls back to current date when created_at missing", () => {
    const recipe = { ...baseRecipe, created_at: undefined };
    const schema = buildRecipeSchema(recipe, null);
    // Should be a valid ISO date string
    expect(() => new Date(schema.datePublished)).not.toThrow();
    expect(new Date(schema.datePublished).getFullYear()).toBeGreaterThanOrEqual(2024);
  });

  test("recipeCategory is always Mood-based", () => {
    const schema = buildRecipeSchema(baseRecipe, null);
    expect(schema.recipeCategory).toBe("Mood-based");
  });

  test("handles empty ingredients", () => {
    const recipe = { ...baseRecipe, ingredients: [] };
    const schema = buildRecipeSchema(recipe, null);
    expect(schema.recipeIngredient).toEqual([]);
  });

  test("handles empty steps", () => {
    const recipe = { ...baseRecipe, steps: [] };
    const schema = buildRecipeSchema(recipe, null);
    expect(schema.recipeInstructions).toEqual([]);
  });
});
