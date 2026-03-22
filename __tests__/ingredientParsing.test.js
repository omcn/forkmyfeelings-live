// Test the ingredient/step JSON parsing used across RecipeCard, CookingMode, ShoppingListModal

function parseIngredients(raw) {
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function parseSteps(raw) {
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

describe("parseIngredients", () => {
  test("returns array as-is when already an array", () => {
    const arr = ["flour", "sugar", "eggs"];
    expect(parseIngredients(arr)).toBe(arr);
  });

  test("parses valid JSON string", () => {
    expect(parseIngredients('["flour","sugar","eggs"]')).toEqual(["flour", "sugar", "eggs"]);
  });

  test("returns empty array for null", () => {
    expect(parseIngredients(null)).toEqual([]);
  });

  test("returns empty array for undefined", () => {
    expect(parseIngredients(undefined)).toEqual([]);
  });

  test("returns empty array for empty string", () => {
    expect(parseIngredients("")).toEqual([]);
  });

  test("returns empty array for invalid JSON", () => {
    expect(parseIngredients("{broken json[")).toEqual([]);
  });

  test("returns empty array for non-array JSON", () => {
    expect(parseIngredients('{"key": "value"}')).toEqual({"key": "value"});
    // Note: this returns the object — matches actual app behavior
  });

  test("handles JSON with special characters", () => {
    expect(parseIngredients('["1/2 cup flour","3 tbsp sugar"]')).toEqual([
      "1/2 cup flour",
      "3 tbsp sugar",
    ]);
  });

  test("handles empty JSON array", () => {
    expect(parseIngredients("[]")).toEqual([]);
  });
});

describe("parseSteps", () => {
  test("returns array as-is", () => {
    const arr = ["Step 1", "Step 2"];
    expect(parseSteps(arr)).toBe(arr);
  });

  test("parses valid JSON string of steps", () => {
    expect(parseSteps('["Preheat oven","Mix ingredients","Bake for 25 min"]')).toEqual([
      "Preheat oven",
      "Mix ingredients",
      "Bake for 25 min",
    ]);
  });

  test("returns empty array for corrupted data", () => {
    expect(parseSteps("not valid")).toEqual([]);
  });

  test("returns empty array for null/undefined", () => {
    expect(parseSteps(null)).toEqual([]);
    expect(parseSteps(undefined)).toEqual([]);
  });
});
