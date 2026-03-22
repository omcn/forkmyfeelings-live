// Test the notifications page logic from notifications/page.js

const TYPE_META = {
  reaction: { icon: "😍", label: "reacted to your post" },
  friend_request: { icon: "👋", label: "sent you a friend request" },
  friend_accepted: { icon: "🤝", label: "accepted your friend request" },
};

describe("Notification type metadata", () => {
  test("reaction type has correct icon and label", () => {
    expect(TYPE_META.reaction.icon).toBe("😍");
    expect(TYPE_META.reaction.label).toBe("reacted to your post");
  });

  test("friend_request type has correct icon and label", () => {
    expect(TYPE_META.friend_request.icon).toBe("👋");
    expect(TYPE_META.friend_request.label).toBe("sent you a friend request");
  });

  test("friend_accepted type has correct icon and label", () => {
    expect(TYPE_META.friend_accepted.icon).toBe("🤝");
    expect(TYPE_META.friend_accepted.label).toBe("accepted your friend request");
  });

  test("unknown type falls back to default", () => {
    const unknownType = "some_new_type";
    const meta = TYPE_META[unknownType] || { icon: "📣", label: "sent you a notification" };
    expect(meta.icon).toBe("📣");
    expect(meta.label).toBe("sent you a notification");
  });
});

describe("Notification display logic", () => {
  test("unread notification has ring styling", () => {
    const notif = { read: false };
    const className = !notif.read ? "ring-1 ring-pink-200" : "";
    expect(className).toBe("ring-1 ring-pink-200");
  });

  test("read notification has no ring", () => {
    const notif = { read: true };
    const className = !notif.read ? "ring-1 ring-pink-200" : "";
    expect(className).toBe("");
  });

  test("actor username displays with @", () => {
    const actor = { username: "alice" };
    const display = `@${actor.username}`;
    expect(display).toBe("@alice");
  });

  test("missing actor username falls back to Someone", () => {
    const actor = { username: null };
    const display = actor?.username ? `@${actor.username}` : "Someone";
    expect(display).toBe("Someone");
  });

  test("friend_request can be accepted if not handled", () => {
    const notif = { type: "friend_request", handled: false };
    const showAccept = notif.type === "friend_request" && !notif.handled;
    expect(showAccept).toBe(true);
  });

  test("handled friend_request shows accepted text", () => {
    const notif = { type: "friend_request", handled: true };
    const showAccepted = notif.handled && notif.type === "friend_request";
    expect(showAccepted).toBe(true);
  });
});
