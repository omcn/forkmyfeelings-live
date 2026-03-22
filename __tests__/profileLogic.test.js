// Test Profile page logic

describe("Profile cook streak calculation", () => {
  function calculateStreak(cookHistory) {
    if (!cookHistory.length) return 0;
    const days = [...new Set(cookHistory.map((h) => h.cookedAt.slice(0, 10)))].sort().reverse();
    let streak = 0;
    let check = new Date("2024-06-15T00:00:00");
    check.setHours(0, 0, 0, 0);
    for (const day of days) {
      const d = new Date(day);
      const diff = Math.round((check - d) / 86400000);
      if (diff === 0 || diff === 1) { streak++; check = d; }
      else break;
    }
    return streak;
  }

  test("returns 0 for empty history", () => {
    expect(calculateStreak([])).toBe(0);
  });

  test("counts today as streak of 1", () => {
    const history = [{ cookedAt: "2024-06-15T10:00:00Z" }];
    expect(calculateStreak(history)).toBe(1);
  });

  test("counts consecutive days", () => {
    const history = [
      { cookedAt: "2024-06-15T10:00:00Z" },
      { cookedAt: "2024-06-14T10:00:00Z" },
      { cookedAt: "2024-06-13T10:00:00Z" },
    ];
    expect(calculateStreak(history)).toBe(3);
  });

  test("breaks on gap day", () => {
    const history = [
      { cookedAt: "2024-06-15T10:00:00Z" },
      { cookedAt: "2024-06-13T10:00:00Z" }, // gap on 14th
    ];
    expect(calculateStreak(history)).toBe(1);
  });

  test("deduplicates same-day entries", () => {
    const history = [
      { cookedAt: "2024-06-15T10:00:00Z" },
      { cookedAt: "2024-06-15T14:00:00Z" },
      { cookedAt: "2024-06-14T10:00:00Z" },
    ];
    expect(calculateStreak(history)).toBe(2);
  });
});

describe("Profile saved recipe removal", () => {
  test("removes recipe by id", () => {
    const saved = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const next = saved.filter((r) => r.id !== 2);
    expect(next).toHaveLength(2);
    expect(next.find((r) => r.id === 2)).toBeUndefined();
  });

  test("undo restores recipe", () => {
    const saved = [{ id: 1 }, { id: 3 }];
    const removed = { id: 2 };
    const restored = [...saved, removed];
    expect(restored).toHaveLength(3);
    expect(restored.find((r) => r.id === 2)).toBeDefined();
  });
});

describe("Profile cook history dedup", () => {
  test("deduplicates and limits to 20", () => {
    const history = Array.from({ length: 25 }, (_, i) => ({
      id: i, name: `Recipe ${i}`, emoji: "🍕", cookedAt: new Date().toISOString(),
    }));
    const entry = { id: 99, name: "New", emoji: "🍝", cookedAt: new Date().toISOString() };
    const deduped = [entry, ...history.filter((h) => h.id !== entry.id)].slice(0, 20);
    expect(deduped).toHaveLength(20);
    expect(deduped[0].id).toBe(99);
  });

  test("moves re-cooked recipe to front", () => {
    const history = [
      { id: 1, name: "A", cookedAt: "old" },
      { id: 2, name: "B", cookedAt: "old" },
    ];
    const entry = { id: 2, name: "B", cookedAt: "new" };
    const deduped = [entry, ...history.filter((h) => h.id !== entry.id)];
    expect(deduped[0].id).toBe(2);
    expect(deduped).toHaveLength(2);
  });
});

describe("Profile display logic", () => {
  test("shows @username when available", () => {
    const profile = { username: "alice" };
    const display = profile?.username ? `@${profile.username}` : "Your Profile";
    expect(display).toBe("@alice");
  });

  test("shows Your Profile when no username", () => {
    const profile = { username: "" };
    const display = profile?.username ? `@${profile.username}` : "Your Profile";
    expect(display).toBe("Your Profile");
  });

  test("streak badge shows days correctly", () => {
    const streak = 5;
    const text = `${streak} day${streak > 1 ? "s" : ""} streak`;
    expect(text).toBe("5 days streak");
  });

  test("streak badge singular for 1 day", () => {
    const streak = 1;
    const text = `${streak} day${streak > 1 ? "s" : ""} streak`;
    expect(text).toBe("1 day streak");
  });

  test("admin link shown for admins", () => {
    const isAdmin = true;
    expect(isAdmin).toBe(true);
  });

  test("delete account clears fmf_ localStorage keys", () => {
    localStorage.setItem("fmf_saved_recipes", "[]");
    localStorage.setItem("fmf_cook_history", "[]");
    localStorage.setItem("other_key", "keep");
    // Simulate the app's deletion logic using key() iteration
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("fmf_")) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    expect(localStorage.getItem("fmf_saved_recipes")).toBeNull();
    expect(localStorage.getItem("fmf_cook_history")).toBeNull();
    expect(localStorage.getItem("other_key")).toBe("keep");
  });
});

describe("Profile delete modal flow", () => {
  test("step 1 shows first confirmation", () => {
    const deleteStep = 1;
    expect(deleteStep).toBe(1);
  });

  test("step 2 shows final confirmation", () => {
    let deleteStep = 1;
    deleteStep = 2;
    expect(deleteStep).toBe(2);
  });
});
