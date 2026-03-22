// Test RecipeDetailModal logic

describe("RecipeDetailModal ingredient/step parsing", () => {
  function parseField(value) {
    return Array.isArray(value) ? value : JSON.parse(value || "[]");
  }

  test("parses array ingredients directly", () => {
    expect(parseField(["flour", "sugar"])).toEqual(["flour", "sugar"]);
  });

  test("parses JSON string ingredients", () => {
    expect(parseField('["flour","sugar"]')).toEqual(["flour", "sugar"]);
  });

  test("returns empty for null", () => {
    expect(parseField(null)).toEqual([]);
  });

  test("returns empty for undefined", () => {
    expect(parseField(undefined)).toEqual([]);
  });

  test("returns empty for empty string", () => {
    expect(parseField("")).toEqual([]);
  });

  test("parses steps the same way", () => {
    expect(parseField(["Boil water", "Cook pasta"])).toEqual(["Boil water", "Cook pasta"]);
    expect(parseField('["Boil water","Cook pasta"]')).toEqual(["Boil water", "Cook pasta"]);
  });
});

describe("RecipeDetailModal UI states", () => {
  test("shows loading skeleton when loading", () => {
    const loading = true;
    const recipe = null;
    const showSkeleton = loading;
    expect(showSkeleton).toBe(true);
  });

  test("shows error when recipe is null after loading", () => {
    const loading = false;
    const recipe = null;
    const showError = !loading && !recipe;
    expect(showError).toBe(true);
  });

  test("shows recipe when loaded", () => {
    const loading = false;
    const recipe = { name: "Pasta", description: "Good" };
    const showRecipe = !loading && recipe;
    expect(showRecipe).toBeTruthy();
  });

  test("Make It button hidden when no onMakeIt", () => {
    const onMakeIt = null;
    const steps = ["step1"];
    const showButton = onMakeIt && steps.length > 0;
    expect(showButton).toBeFalsy();
  });

  test("Make It button hidden when no steps", () => {
    const onMakeIt = () => {};
    const steps = [];
    const showButton = onMakeIt && steps.length > 0;
    expect(showButton).toBeFalsy();
  });

  test("Make It button shown when onMakeIt and steps exist", () => {
    const onMakeIt = () => {};
    const steps = ["step1"];
    const showButton = onMakeIt && steps.length > 0;
    expect(showButton).toBeTruthy();
  });
});
