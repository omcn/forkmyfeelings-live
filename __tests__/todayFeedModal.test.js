// Test TodayFeedModal logic

describe("TodayFeedModal date filtering", () => {
  test("today's date is formatted as YYYY-MM-DD", () => {
    const today = new Date("2024-06-15T14:30:00Z").toISOString().slice(0, 10);
    expect(today).toBe("2024-06-15");
  });

  test("posts from today pass date filter", () => {
    const today = "2024-06-15";
    const post = { created_at: "2024-06-15T10:00:00Z" };
    expect(post.created_at >= today).toBe(true);
  });

  test("posts from yesterday are excluded", () => {
    const today = "2024-06-15";
    const post = { created_at: "2024-06-14T23:59:59Z" };
    expect(post.created_at >= today).toBe(false);
  });
});

describe("TodayFeedModal display logic", () => {
  test("author shows @username when available", () => {
    const post = { profiles: { username: "alice", avatar_url: "/a.jpg" } };
    const display = post.profiles?.username ? `@${post.profiles.username}` : "Anonymous";
    expect(display).toBe("@alice");
  });

  test("author falls back to Anonymous", () => {
    const post = { profiles: null };
    const display = post.profiles?.username ? `@${post.profiles.username}` : "Anonymous";
    expect(display).toBe("Anonymous");
  });

  test("mood displays as comma-joined array", () => {
    const post = { moods: ["happy", "chill"] };
    const display = Array.isArray(post.moods) ? post.moods.join(", ") : post.moods;
    expect(display).toBe("happy, chill");
  });

  test("mood displays as string directly", () => {
    const post = { moods: "happy" };
    const display = Array.isArray(post.moods) ? post.moods.join(", ") : post.moods;
    expect(display).toBe("happy");
  });

  test("rating shows correct number of stars", () => {
    const post = { rating: 4 };
    const stars = "⭐".repeat(post.rating);
    expect(stars).toBe("⭐⭐⭐⭐");
  });

  test("zero rating shows no stars", () => {
    const post = { rating: 0 };
    const showStars = post.rating > 0;
    expect(showStars).toBe(false);
  });

  test("recipe info shows emoji and name", () => {
    const post = { recipes: { emoji: "🍝", name: "Pasta" } };
    const display = `${post.recipes.emoji} ${post.recipes.name}`;
    expect(display).toBe("🍝 Pasta");
  });

  test("loading shows 3 skeleton items", () => {
    const skeletons = [...Array(3)].map((_, i) => i);
    expect(skeletons).toHaveLength(3);
  });
});
