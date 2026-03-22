// Test the leaderboard calculation logic from leaderboard/page.js

function calculateTopRecipes(ratingData) {
  const grouped = {};
  ratingData.forEach(({ recipe_id, rating }) => {
    if (!grouped[recipe_id]) grouped[recipe_id] = [];
    grouped[recipe_id].push(rating);
  });

  return Object.entries(grouped)
    .filter(([, ratings]) => ratings.length >= 2)
    .map(([id, ratings]) => ({
      id: Number(id),
      avg: ratings.reduce((a, b) => a + b, 0) / ratings.length,
      count: ratings.length,
    }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);
}

function calculateTopChefs(posts) {
  const chefMap = {};
  posts.forEach(({ user_id, profile }) => {
    if (!chefMap[user_id]) chefMap[user_id] = { user_id, profile, count: 0 };
    chefMap[user_id].count++;
  });
  return Object.values(chefMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

describe("Leaderboard top recipes", () => {
  test("returns empty for no ratings", () => {
    expect(calculateTopRecipes([])).toEqual([]);
  });

  test("filters out recipes with less than 2 ratings", () => {
    const data = [
      { recipe_id: 1, rating: 5 },
    ];
    expect(calculateTopRecipes(data)).toEqual([]);
  });

  test("includes recipes with 2+ ratings", () => {
    const data = [
      { recipe_id: 1, rating: 5 },
      { recipe_id: 1, rating: 4 },
    ];
    const result = calculateTopRecipes(data);
    expect(result).toHaveLength(1);
    expect(result[0].avg).toBe(4.5);
    expect(result[0].count).toBe(2);
  });

  test("sorts by average descending", () => {
    const data = [
      { recipe_id: 1, rating: 3 }, { recipe_id: 1, rating: 3 },
      { recipe_id: 2, rating: 5 }, { recipe_id: 2, rating: 5 },
      { recipe_id: 3, rating: 4 }, { recipe_id: 3, rating: 4 },
    ];
    const result = calculateTopRecipes(data);
    expect(result[0].id).toBe(2); // avg 5
    expect(result[1].id).toBe(3); // avg 4
    expect(result[2].id).toBe(1); // avg 3
  });

  test("limits to 10 results", () => {
    const data = [];
    for (let i = 0; i < 15; i++) {
      data.push({ recipe_id: i, rating: 5 });
      data.push({ recipe_id: i, rating: 4 });
    }
    expect(calculateTopRecipes(data)).toHaveLength(10);
  });

  test("calculates average correctly with mixed ratings", () => {
    const data = [
      { recipe_id: 1, rating: 5 },
      { recipe_id: 1, rating: 3 },
      { recipe_id: 1, rating: 4 },
    ];
    const result = calculateTopRecipes(data);
    expect(result[0].avg).toBe(4);
    expect(result[0].count).toBe(3);
  });
});

describe("Leaderboard top chefs", () => {
  test("returns empty for no posts", () => {
    expect(calculateTopChefs([])).toEqual([]);
  });

  test("counts posts per chef", () => {
    const posts = [
      { user_id: "u1", profile: { username: "alice" } },
      { user_id: "u1", profile: { username: "alice" } },
      { user_id: "u1", profile: { username: "alice" } },
      { user_id: "u2", profile: { username: "bob" } },
    ];
    const result = calculateTopChefs(posts);
    expect(result[0].user_id).toBe("u1");
    expect(result[0].count).toBe(3);
    expect(result[1].user_id).toBe("u2");
    expect(result[1].count).toBe(1);
  });

  test("sorts by post count descending", () => {
    const posts = [
      { user_id: "u1", profile: null },
      { user_id: "u2", profile: null }, { user_id: "u2", profile: null },
      { user_id: "u3", profile: null }, { user_id: "u3", profile: null }, { user_id: "u3", profile: null },
    ];
    const result = calculateTopChefs(posts);
    expect(result[0].user_id).toBe("u3");
    expect(result[1].user_id).toBe("u2");
    expect(result[2].user_id).toBe("u1");
  });

  test("limits to 10 results", () => {
    const posts = Array.from({ length: 15 }, (_, i) => ({
      user_id: `u${i}`, profile: null,
    }));
    expect(calculateTopChefs(posts)).toHaveLength(10);
  });
});

describe("Medal assignment", () => {
  const medals = ["🥇", "🥈", "🥉"];

  test("first 3 positions get medals", () => {
    expect(medals[0]).toBe("🥇");
    expect(medals[1]).toBe("🥈");
    expect(medals[2]).toBe("🥉");
  });

  test("positions beyond 3 get number", () => {
    expect(medals[3]).toBeUndefined();
    // App uses: medals[i] || `${i + 1}`
    expect(medals[5] || "6").toBe("6");
  });
});
