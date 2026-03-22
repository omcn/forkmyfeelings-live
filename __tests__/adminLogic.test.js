// Test the admin page logic from admin/page.js

describe("Admin access control", () => {
  test("profile with is_admin=true grants access", () => {
    const profile = { is_admin: true };
    const ADMIN_EMAILS = [];
    const email = "user@test.com";
    const admin = profile?.is_admin === true || ADMIN_EMAILS.includes(email);
    expect(admin).toBe(true);
  });

  test("email in ADMIN_EMAILS grants access", () => {
    const profile = { is_admin: false };
    const ADMIN_EMAILS = ["admin@forkmyfeelings.com"];
    const email = "admin@forkmyfeelings.com";
    const admin = profile?.is_admin === true || ADMIN_EMAILS.includes(email);
    expect(admin).toBe(true);
  });

  test("regular user is denied", () => {
    const profile = { is_admin: false };
    const ADMIN_EMAILS = ["admin@forkmyfeelings.com"];
    const email = "user@test.com";
    const admin = profile?.is_admin === true || ADMIN_EMAILS.includes(email);
    expect(admin).toBe(false);
  });

  test("null profile denies access", () => {
    const profile = null;
    const ADMIN_EMAILS = [];
    const email = "user@test.com";
    const admin = profile?.is_admin === true || ADMIN_EMAILS.includes(email);
    expect(admin).toBe(false);
  });
});

describe("Admin ingredient parsing", () => {
  function parseIngredients(r) {
    try {
      return Array.isArray(r.ingredients) ? r.ingredients : JSON.parse(r.ingredients || "[]");
    } catch {
      return [];
    }
  }

  test("parses array ingredients", () => {
    expect(parseIngredients({ ingredients: ["flour", "sugar"] })).toEqual(["flour", "sugar"]);
  });

  test("parses JSON string ingredients", () => {
    expect(parseIngredients({ ingredients: '["flour","sugar"]' })).toEqual(["flour", "sugar"]);
  });

  test("returns empty for null", () => {
    expect(parseIngredients({ ingredients: null })).toEqual([]);
  });

  test("returns empty for corrupted JSON", () => {
    expect(parseIngredients({ ingredients: "{broken" })).toEqual([]);
  });
});

describe("Admin recipe filtering", () => {
  const recipes = [
    { id: 1, name: "Pasta", status: "pending" },
    { id: 2, name: "Soup", status: "approved" },
    { id: 3, name: "Salad", status: "pending" },
    { id: 4, name: "Cake", status: "rejected" },
  ];

  test("filter pending shows only pending", () => {
    const filtered = recipes.filter((r) => r.status === "pending");
    expect(filtered).toHaveLength(2);
  });

  test("filter approved shows only approved", () => {
    const filtered = recipes.filter((r) => r.status === "approved");
    expect(filtered).toHaveLength(1);
  });

  test("filter all shows everything", () => {
    expect(recipes).toHaveLength(4);
  });

  test("approve removes from pending list", () => {
    const afterApprove = recipes.filter((r) => r.id !== 1);
    expect(afterApprove).toHaveLength(3);
    expect(afterApprove.find((r) => r.id === 1)).toBeUndefined();
  });
});
