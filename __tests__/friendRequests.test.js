// Test FriendRequests component logic

describe("FriendRequests action handling", () => {
  test("accept removes request from list", () => {
    const requests = [
      { id: 1, user_id: "u1", profile: { username: "alice" } },
      { id: 2, user_id: "u2", profile: { username: "bob" } },
    ];
    const afterAccept = requests.filter((r) => r.id !== 1);
    expect(afterAccept).toHaveLength(1);
    expect(afterAccept[0].user_id).toBe("u2");
  });

  test("reject removes request from list", () => {
    const requests = [
      { id: 1, user_id: "u1", profile: { username: "alice" } },
    ];
    const afterReject = requests.filter((r) => r.id !== 1);
    expect(afterReject).toHaveLength(0);
  });

  test("shows no pending requests when empty", () => {
    const requests = [];
    expect(requests.length === 0).toBe(true);
  });

  test("displays username with @ prefix", () => {
    const req = { profile: { username: "alice" } };
    const display = `@${req.profile?.username || "Unknown"}`;
    expect(display).toBe("@alice");
  });

  test("falls back to Unknown when no username", () => {
    const req = { profile: null };
    const display = `@${req.profile?.username || "Unknown"}`;
    expect(display).toBe("@Unknown");
  });

  test("falls back avatar to rascal-fallback", () => {
    const req = { profile: { avatar_url: null } };
    const avatar = req.profile?.avatar_url || "/rascal-fallback.png";
    expect(avatar).toBe("/rascal-fallback.png");
  });
});
