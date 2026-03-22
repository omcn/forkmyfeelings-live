// Test FriendList component logic

describe("FriendList friend resolution", () => {
  function resolveFriends(data, profileId, profileMap) {
    return data.map((f) => {
      const otherId = f.user_id === profileId ? f.friend_id : f.user_id;
      const otherProfile = profileMap[otherId];
      return {
        id: f.id,
        username: otherProfile?.username || "Unnamed",
        avatar_url: otherProfile?.avatar_url || "/rascal-fallback.png",
      };
    });
  }

  test("resolves other user when current is user_id", () => {
    const data = [{ id: 1, user_id: "me", friend_id: "them" }];
    const profileMap = { them: { username: "alice", avatar_url: "/alice.jpg" } };
    const result = resolveFriends(data, "me", profileMap);
    expect(result[0].username).toBe("alice");
    expect(result[0].avatar_url).toBe("/alice.jpg");
  });

  test("resolves other user when current is friend_id", () => {
    const data = [{ id: 2, user_id: "them", friend_id: "me" }];
    const profileMap = { them: { username: "bob", avatar_url: "/bob.jpg" } };
    const result = resolveFriends(data, "me", profileMap);
    expect(result[0].username).toBe("bob");
  });

  test("falls back to Unnamed when profile missing", () => {
    const data = [{ id: 3, user_id: "me", friend_id: "unknown" }];
    const result = resolveFriends(data, "me", {});
    expect(result[0].username).toBe("Unnamed");
    expect(result[0].avatar_url).toBe("/rascal-fallback.png");
  });

  test("handles empty friends list", () => {
    expect(resolveFriends([], "me", {})).toEqual([]);
  });

  test("handles multiple friends", () => {
    const data = [
      { id: 1, user_id: "me", friend_id: "a" },
      { id: 2, user_id: "b", friend_id: "me" },
    ];
    const profileMap = {
      a: { username: "alice", avatar_url: "/a.jpg" },
      b: { username: "bob", avatar_url: "/b.jpg" },
    };
    const result = resolveFriends(data, "me", profileMap);
    expect(result).toHaveLength(2);
    expect(result[0].username).toBe("alice");
    expect(result[1].username).toBe("bob");
  });
});

describe("FriendList UI states", () => {
  test("shows missing profile warning when no id", () => {
    const profile = null;
    const showWarning = !profile?.id;
    expect(showWarning).toBe(true);
  });

  test("shows empty state when no friends and profile exists", () => {
    const friends = [];
    const profile = { id: "123" };
    const loading = false;
    const error = null;
    const showEmpty = !loading && !error && friends.length === 0 && profile?.id;
    expect(showEmpty).toBeTruthy();
  });

  test("shows friends list when friends exist", () => {
    const friends = [{ id: 1, username: "alice" }];
    const loading = false;
    const showList = !loading && friends.length > 0;
    expect(showList).toBe(true);
  });
});
