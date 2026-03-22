// Test the SavedRecipes localStorage logic

describe("SavedRecipes localStorage logic", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function loadSaved() {
    try {
      const raw = localStorage.getItem("fmf_saved_recipes");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function removeSaved(id, saved) {
    return saved.filter((r) => r.id !== id);
  }

  test("returns empty array when nothing saved", () => {
    expect(loadSaved()).toEqual([]);
  });

  test("returns empty array for corrupted JSON", () => {
    localStorage.setItem("fmf_saved_recipes", "{broken");
    expect(loadSaved()).toEqual([]);
  });

  test("loads saved recipes from localStorage", () => {
    const recipes = [
      { id: "r1", name: "Pasta", emoji: "🍝" },
      { id: "r2", name: "Soup", emoji: "🍲" },
    ];
    localStorage.setItem("fmf_saved_recipes", JSON.stringify(recipes));
    expect(loadSaved()).toEqual(recipes);
  });

  test("removes a recipe by ID", () => {
    const saved = [
      { id: "r1", name: "Pasta" },
      { id: "r2", name: "Soup" },
      { id: "r3", name: "Salad" },
    ];
    const result = removeSaved("r2", saved);
    expect(result).toHaveLength(2);
    expect(result.find((r) => r.id === "r2")).toBeUndefined();
  });

  test("removing non-existent ID returns unchanged array", () => {
    const saved = [{ id: "r1", name: "Pasta" }];
    expect(removeSaved("r99", saved)).toEqual(saved);
  });

  test("persists removal to localStorage", () => {
    const saved = [
      { id: "r1", name: "Pasta" },
      { id: "r2", name: "Soup" },
    ];
    const next = removeSaved("r1", saved);
    localStorage.setItem("fmf_saved_recipes", JSON.stringify(next));
    expect(loadSaved()).toEqual([{ id: "r2", name: "Soup" }]);
  });
});
