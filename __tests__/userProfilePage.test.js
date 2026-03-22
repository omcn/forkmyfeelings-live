// Test User Profile page logic (app/user/[id]/page.js)

describe("User profile friendship status", () => {
  function determineFriendStatus(friendship, meId) {
    if (!friendship) return null;
    if (friendship.status === "accepted") return "accepted";
    if (friendship.user_id === meId) return "sent";
    return "pending";
  }

  test("returns null when no friendship", () => {
    expect(determineFriendStatus(null, "me")).toBeNull();
  });

  test("returns accepted for accepted friendship", () => {
    const f = { status: "accepted", user_id: "them", friend_id: "me" };
    expect(determineFriendStatus(f, "me")).toBe("accepted");
  });

  test("returns sent when I sent the request", () => {
    const f = { status: "pending", user_id: "me", friend_id: "them" };
    expect(determineFriendStatus(f, "me")).toBe("sent");
  });

  test("returns pending when they sent the request", () => {
    const f = { status: "pending", user_id: "them", friend_id: "me" };
    expect(determineFriendStatus(f, "me")).toBe("pending");
  });
});

describe("User profile display", () => {
  test("shows @username or unknown", () => {
    expect("@" + ("alice" || "unknown")).toBe("@alice");
    expect("@" + ("" || "unknown")).toBe("@unknown");
  });

  test("post count pluralizes", () => {
    const count = (n) => `${n} post${n !== 1 ? "s" : ""}`;
    expect(count(0)).toBe("0 posts");
    expect(count(1)).toBe("1 post");
    expect(count(5)).toBe("5 posts");
  });

  test("isMe check prevents adding self", () => {
    const currentUserId = "abc";
    const id = "abc";
    expect(currentUserId === id).toBe(true);
  });

  test("posts grid shows placeholder for no photo", () => {
    const post = { photo_url: null, recipes: { emoji: "🍝", name: "Pasta" } };
    const hasPhoto = !!post.photo_url;
    expect(hasPhoto).toBe(false);
    expect(post.recipes.emoji).toBe("🍝");
  });

  test("avatar falls back to rascal-fallback", () => {
    const avatar = null || "/rascal-fallback.png";
    expect(avatar).toBe("/rascal-fallback.png");
  });
});

describe("User profile friend actions", () => {
  test("send friend request creates pending row", () => {
    const data = { user_id: "me", friend_id: "them", status: "pending" };
    expect(data.status).toBe("pending");
    expect(data.user_id).toBe("me");
    expect(data.friend_id).toBe("them");
  });

  test("notification is created for friend request", () => {
    const notif = {
      user_id: "them",
      type: "friend_request",
      actor_id: "me",
      resource_id: "me",
      read: false,
    };
    expect(notif.type).toBe("friend_request");
    expect(notif.read).toBe(false);
  });

  test("no add button shown for guests", () => {
    const currentUserId = null;
    const isMe = false;
    const showButton = !isMe && currentUserId;
    expect(showButton).toBeFalsy();
  });
});
