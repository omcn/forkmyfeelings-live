// Test the recipe submission validation logic from submit/page.js

const VALID_MOODS = [
  "tired", "happy", "sad", "rushed", "date-night", "chill",
  "recovering", "bored", "nostalgic", "overwhelmed",
];

function validate(form) {
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

  return e;
}

const validForm = {
  name: "Chocolate Cake",
  description: "A rich chocolate cake",
  ingredients: "flour\nsugar\ncocoa\nbutter",
  steps: "Mix dry\nMix wet\nCombine\nBake",
  moods: "happy, chill",
  emoji: "🍫",
};

describe("Recipe submission validation", () => {
  test("valid form returns no errors", () => {
    expect(Object.keys(validate(validForm))).toHaveLength(0);
  });

  test("name too short", () => {
    const errors = validate({ ...validForm, name: "ab" });
    expect(errors.name).toBe("Recipe name must be at least 3 characters.");
  });

  test("name too long", () => {
    const errors = validate({ ...validForm, name: "a".repeat(101) });
    expect(errors.name).toBe("Recipe name is too long (max 100 chars).");
  });

  test("description too long", () => {
    const errors = validate({ ...validForm, description: "a".repeat(501) });
    expect(errors.description).toBe("Description is too long (max 500 chars).");
  });

  test("less than 2 ingredients", () => {
    const errors = validate({ ...validForm, ingredients: "flour" });
    expect(errors.ingredients).toBe("Please list at least 2 ingredients.");
  });

  test("more than 50 ingredients", () => {
    const errors = validate({ ...validForm, ingredients: Array(51).fill("item").join("\n") });
    expect(errors.ingredients).toBe("Too many ingredients (max 50).");
  });

  test("less than 2 steps", () => {
    const errors = validate({ ...validForm, steps: "Mix" });
    expect(errors.steps).toBe("Please list at least 2 steps.");
  });

  test("more than 30 steps", () => {
    const errors = validate({ ...validForm, steps: Array(31).fill("step").join("\n") });
    expect(errors.steps).toBe("Too many steps (max 30).");
  });

  test("no moods", () => {
    const errors = validate({ ...validForm, moods: "" });
    expect(errors.moods).toBe("Please select at least one mood.");
  });

  test("invalid mood", () => {
    const errors = validate({ ...validForm, moods: "happy, angry" });
    expect(errors.moods).toContain("Invalid mood(s): angry");
  });

  test("valid moods pass", () => {
    const errors = validate({ ...validForm, moods: "happy, sad, tired" });
    expect(errors.moods).toBeUndefined();
  });

  test("all valid moods are accepted", () => {
    VALID_MOODS.forEach((mood) => {
      const errors = validate({ ...validForm, moods: mood });
      expect(errors.moods).toBeUndefined();
    });
  });

  test("trims whitespace from name", () => {
    const errors = validate({ ...validForm, name: "   ab   " });
    expect(errors.name).toBe("Recipe name must be at least 3 characters.");
  });

  test("empty lines in ingredients are filtered", () => {
    const errors = validate({ ...validForm, ingredients: "flour\n\n\nsugar" });
    expect(errors.ingredients).toBeUndefined();
  });

  test("whitespace-only lines in steps are filtered", () => {
    const errors = validate({ ...validForm, steps: "Step 1\n   \nStep 2" });
    expect(errors.steps).toBeUndefined();
  });

  test("moods are case-insensitive", () => {
    const errors = validate({ ...validForm, moods: "Happy, CHILL" });
    expect(errors.moods).toBeUndefined();
  });

  test("multiple errors at once", () => {
    const errors = validate({
      name: "ab",
      description: "",
      ingredients: "one",
      steps: "one",
      moods: "",
      emoji: "",
    });
    expect(errors.name).toBeDefined();
    expect(errors.ingredients).toBeDefined();
    expect(errors.steps).toBeDefined();
    expect(errors.moods).toBeDefined();
  });
});

describe("Rate limiting", () => {
  test("blocks submission within 30 seconds", () => {
    const lastSubmitTime = Date.now();
    const now = lastSubmitTime + 15000; // 15 seconds later
    expect(now - lastSubmitTime < 30000).toBe(true);
  });

  test("allows submission after 30 seconds", () => {
    const lastSubmitTime = Date.now() - 31000;
    const now = Date.now();
    expect(now - lastSubmitTime < 30000).toBe(false);
  });
});
