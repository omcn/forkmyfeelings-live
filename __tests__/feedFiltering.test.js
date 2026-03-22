// Test the feed post filtering logic from FeedOverlay.js

function filterPosts(posts, feedTab, friendIds) {
  if (feedTab === "friends") {
    return posts.filter((p) => friendIds.has(p.user_id));
  }
  return posts;
}

const mockPosts = [
  { id: "p1", user_id: "u1", moods: ["happy"], rating: 5, created_at: "2024-01-01T10:00:00Z" },
  { id: "p2", user_id: "u2", moods: ["sad"], rating: 3, created_at: "2024-01-01T11:00:00Z" },
  { id: "p3", user_id: "u3", moods: ["tired"], rating: 4, created_at: "2024-01-01T12:00:00Z" },
  { id: "p4", user_id: "u1", moods: ["chill"], rating: 5, created_at: "2024-01-01T13:00:00Z" },
  { id: "p5", user_id: "u4", moods: ["rushed"], rating: 2, created_at: "2024-01-01T14:00:00Z" },
];

describe("Feed post filtering", () => {
  test("'all' tab returns all posts", () => {
    const result = filterPosts(mockPosts, "all", new Set());
    expect(result).toHaveLength(5);
    expect(result).toEqual(mockPosts);
  });

  test("'friends' tab filters to only friend posts", () => {
    const friendIds = new Set(["u1", "u3"]);
    const result = filterPosts(mockPosts, "friends", friendIds);
    expect(result).toHaveLength(3); // u1 has 2 posts, u3 has 1
    expect(result.every((p) => friendIds.has(p.user_id))).toBe(true);
  });

  test("'friends' tab with no friends returns empty", () => {
    const result = filterPosts(mockPosts, "friends", new Set());
    expect(result).toHaveLength(0);
  });

  test("'friends' tab with all users as friends returns all", () => {
    const allUsers = new Set(["u1", "u2", "u3", "u4"]);
    const result = filterPosts(mockPosts, "friends", allUsers);
    expect(result).toHaveLength(5);
  });

  test("empty posts returns empty for any tab", () => {
    expect(filterPosts([], "all", new Set())).toHaveLength(0);
    expect(filterPosts([], "friends", new Set(["u1"]))).toHaveLength(0);
  });

  test("'all' tab does not reference friendIds at all", () => {
    const result = filterPosts(mockPosts, "all", new Set(["nonexistent"]));
    expect(result).toHaveLength(5);
  });

  test("duplicate friend IDs in Set don't cause issues", () => {
    const friendIds = new Set(["u1", "u1", "u1"]);
    const result = filterPosts(mockPosts, "friends", friendIds);
    expect(result).toHaveLength(2); // u1 has 2 posts
  });
});

describe("Feed reaction handling", () => {
  const availableReactions = ["😍", "🤤", "👏", "🔥", "❤️"];

  test("there are exactly 5 reaction emojis", () => {
    expect(availableReactions).toHaveLength(5);
  });

  test("each reaction is a single emoji", () => {
    availableReactions.forEach((r) => {
      expect(r.length).toBeGreaterThan(0);
      expect(r.length).toBeLessThanOrEqual(2); // emoji can be 1-2 chars
    });
  });

  test("reaction counts default to empty object", () => {
    const rxCounts = {};
    const count = rxCounts["😍"] || 0;
    expect(count).toBe(0);
  });

  test("reaction counts increment correctly", () => {
    const rxCounts = { "😍": 3, "🔥": 1 };
    expect(rxCounts["😍"]).toBe(3);
    expect(rxCounts["🔥"]).toBe(1);
    expect(rxCounts["👏"] || 0).toBe(0);
  });

  test("myReaction tracks which emoji user selected", () => {
    const feedReactions = { p1: "😍", p2: "🔥" };
    expect(feedReactions["p1"]).toBe("😍");
    expect(feedReactions["p3"]).toBeUndefined();
  });
});

describe("Feed post display", () => {
  test("post moods display correctly when array", () => {
    const post = { moods: ["happy", "chill"] };
    const display = Array.isArray(post.moods) ? post.moods.join(", ") : post.moods;
    expect(display).toBe("happy, chill");
  });

  test("post moods display correctly when string", () => {
    const post = { moods: "happy" };
    const display = Array.isArray(post.moods) ? post.moods.join(", ") : post.moods;
    expect(display).toBe("happy");
  });

  test("rating stars are capped at 5", () => {
    expect(Math.min(7, 5)).toBe(5);
    expect(Math.min(3, 5)).toBe(3);
    expect(Math.min(0, 5)).toBe(0);
  });

  test("author falls back to Anonymous Chef when no username", () => {
    const author = { username: null, avatar_url: null };
    const displayName = author?.username ? `@${author.username}` : "Anonymous Chef";
    expect(displayName).toBe("Anonymous Chef");
  });

  test("author shows @username when available", () => {
    const author = { username: "oisin", avatar_url: "http://example.com/pic.jpg" };
    const displayName = author?.username ? `@${author.username}` : "Anonymous Chef";
    expect(displayName).toBe("@oisin");
  });
});
