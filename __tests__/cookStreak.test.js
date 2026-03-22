// Test the cook streak calculation logic (used in profile page)

function calculateCookStreak(cookHistory) {
  if (!cookHistory.length) return 0;
  const days = [...new Set(cookHistory.map((h) => h.cookedAt.slice(0, 10)))].sort().reverse();
  let streak = 0;
  let check = new Date();
  check.setHours(0, 0, 0, 0);
  for (const day of days) {
    const d = new Date(day);
    const diff = Math.round((check - d) / 86400000);
    if (diff === 0 || diff === 1) { streak++; check = d; }
    else break;
  }
  return streak;
}

describe("calculateCookStreak", () => {
  const today = new Date();
  const formatDate = (date) => date.toISOString();
  const daysAgo = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };

  test("returns 0 for empty history", () => {
    expect(calculateCookStreak([])).toBe(0);
  });

  test("returns 1 for cooking today only", () => {
    const history = [{ cookedAt: formatDate(today) }];
    expect(calculateCookStreak(history)).toBe(1);
  });

  test("returns 3 for cooking today, yesterday, and day before", () => {
    const history = [
      { cookedAt: formatDate(today) },
      { cookedAt: formatDate(daysAgo(1)) },
      { cookedAt: formatDate(daysAgo(2)) },
    ];
    expect(calculateCookStreak(history)).toBe(3);
  });

  test("returns 1 when there is a gap (cooked today and 3 days ago)", () => {
    const history = [
      { cookedAt: formatDate(today) },
      { cookedAt: formatDate(daysAgo(3)) },
    ];
    expect(calculateCookStreak(history)).toBe(1);
  });

  test("handles multiple cooks on the same day", () => {
    const history = [
      { cookedAt: formatDate(today) },
      { cookedAt: formatDate(today) }, // same day
      { cookedAt: formatDate(daysAgo(1)) },
    ];
    // Should be 2 (today + yesterday), not 3
    expect(calculateCookStreak(history)).toBe(2);
  });

  test("returns 2 for cooking yesterday and day before (not today)", () => {
    const history = [
      { cookedAt: formatDate(daysAgo(1)) },
      { cookedAt: formatDate(daysAgo(2)) },
    ];
    expect(calculateCookStreak(history)).toBe(2);
  });

  test("returns 0 for cooking only 5 days ago", () => {
    const history = [
      { cookedAt: formatDate(daysAgo(5)) },
    ];
    expect(calculateCookStreak(history)).toBe(0);
  });
});
