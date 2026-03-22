// Test the shopping list text generation and download logic from ShoppingListModal.js

function parseIngredients(recipe) {
  return Array.isArray(recipe.ingredients)
    ? recipe.ingredients
    : (() => { try { return JSON.parse(recipe.ingredients || "[]"); } catch { return []; } })();
}

function generateListText(ingredients) {
  return ingredients.join("\n");
}

function generateDownloadFilename(recipeName) {
  return `shopping-list-${recipeName.replace(/\s+/g, "-").toLowerCase()}.txt`;
}

function generateDownloadURI(listText) {
  return `data:text/plain;charset=utf-8,${encodeURIComponent(listText)}`;
}

describe("Shopping list ingredient parsing", () => {
  test("parses array ingredients directly", () => {
    const recipe = { ingredients: ["flour", "sugar"] };
    expect(parseIngredients(recipe)).toEqual(["flour", "sugar"]);
  });

  test("parses JSON string ingredients", () => {
    const recipe = { ingredients: '["flour","sugar"]' };
    expect(parseIngredients(recipe)).toEqual(["flour", "sugar"]);
  });

  test("returns empty array for missing ingredients", () => {
    const recipe = {};
    expect(parseIngredients(recipe)).toEqual([]);
  });

  test("returns empty array for corrupted JSON", () => {
    const recipe = { ingredients: "{broken" };
    expect(parseIngredients(recipe)).toEqual([]);
  });
});

describe("Shopping list text generation", () => {
  test("joins ingredients with newlines", () => {
    expect(generateListText(["flour", "sugar", "eggs"])).toBe("flour\nsugar\neggs");
  });

  test("returns empty string for empty array", () => {
    expect(generateListText([])).toBe("");
  });

  test("handles single ingredient", () => {
    expect(generateListText(["flour"])).toBe("flour");
  });

  test("preserves special characters in ingredients", () => {
    expect(generateListText(["1/2 cup flour", "3 tbsp sugar (packed)"])).toBe(
      "1/2 cup flour\n3 tbsp sugar (packed)"
    );
  });
});

describe("Shopping list download filename", () => {
  test("converts recipe name to kebab-case", () => {
    expect(generateDownloadFilename("Chocolate Cake")).toBe("shopping-list-chocolate-cake.txt");
  });

  test("handles multiple spaces", () => {
    expect(generateDownloadFilename("Mac   And   Cheese")).toBe("shopping-list-mac-and-cheese.txt");
  });

  test("lowercases the name", () => {
    expect(generateDownloadFilename("PASTA")).toBe("shopping-list-pasta.txt");
  });

  test("handles single word name", () => {
    expect(generateDownloadFilename("Soup")).toBe("shopping-list-soup.txt");
  });
});

describe("Shopping list download URI", () => {
  test("generates valid data URI", () => {
    const uri = generateDownloadURI("flour\nsugar");
    expect(uri).toStartWith("data:text/plain;charset=utf-8,");
    expect(uri).toContain("flour");
  });

  test("encodes special characters", () => {
    const uri = generateDownloadURI("1/2 cup flour");
    expect(decodeURIComponent(uri.split(",")[1])).toBe("1/2 cup flour");
  });
});

// Custom matcher polyfill
expect.extend({
  toStartWith(received, prefix) {
    const pass = received.startsWith(prefix);
    return {
      pass,
      message: () => `expected "${received}" to start with "${prefix}"`,
    };
  },
});
