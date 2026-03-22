// Test the insights page calculation logic from insights/page.js

// Cook streak calculation (extracted from InsightsPage)
function calculateCookStreak(cookHistory) {
  const days = [...new Set(cookHistory.map((h) => h.cookedAt?.slice(0, 10)).filter(Boolean))]
    .sort()
    .reverse();
  let streak = 0;
  let check = new Date();
  check.setHours(0, 0, 0, 0);
  for (const day of days) {
    const d = new Date(day);
    const diff = Math.round((check - d) / 86400000);
    if (diff === 0 || diff === 1) { streak++; check = d; } else break;
  }
  return streak;
}

// Most cooked recipes (extracted from InsightsPage)
function calculateMostCooked(cookHistory) {
  const counts = {};
  cookHistory.forEach((h) => {
    if (!h.id) return;
    if (!counts[h.id]) counts[h.id] = { ...h, count: 0 };
    counts[h.id].count++;
  });
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
}

// Last 7 days frequency
function calculateLast7(cookHistory) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const count = cookHistory.filter((h) => h.cookedAt?.slice(0, 10) === key).length;
    days.push({ label: d.toLocaleDateString("en-GB", { weekday: "short" }), count });
  }
  return days;
}

// Mood usage
function calculateMoodCounts(ratingHistory) {
  const counts = {};
  ratingHistory.forEach((r) => {
    if (r.mood) counts[r.mood] = (counts[r.mood] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
}

// Average rating
function calculateAvgRating(ratingHistory) {
  if (ratingHistory.length === 0) return null;
  return (ratingHistory.reduce((s, r) => s + r.rating, 0) / ratingHistory.length).toFixed(1);
}

describe("Cook streak calculation", () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const dayBefore = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);

  test("empty history returns 0", () => {
    expect(calculateCookStreak([])).toBe(0);
  });

  test("cooking today is streak of 1", () => {
    expect(calculateCookStreak([{ cookedAt: today + "T10:00:00Z" }])).toBe(1);
  });

  test("3 consecutive days is streak of 3", () => {
    expect(calculateCookStreak([
      { cookedAt: today + "T10:00:00Z" },
      { cookedAt: yesterday + "T10:00:00Z" },
      { cookedAt: dayBefore + "T10:00:00Z" },
    ])).toBe(3);
  });

  test("gap breaks the streak", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
    expect(calculateCookStreak([
      { cookedAt: today + "T10:00:00Z" },
      { cookedAt: threeDaysAgo + "T10:00:00Z" },
    ])).toBe(1);
  });

  test("duplicate days count as 1", () => {
    expect(calculateCookStreak([
      { cookedAt: today + "T08:00:00Z" },
      { cookedAt: today + "T12:00:00Z" },
      { cookedAt: today + "T18:00:00Z" },
    ])).toBe(1);
  });
});

describe("Most cooked recipes", () => {
  test("empty history", () => {
    expect(calculateMostCooked([])).toEqual([]);
  });

  test("counts correctly", () => {
    const history = [
      { id: "r1", name: "Pasta" },
      { id: "r1", name: "Pasta" },
      { id: "r1", name: "Pasta" },
      { id: "r2", name: "Soup" },
      { id: "r2", name: "Soup" },
    ];
    const result = calculateMostCooked(history);
    expect(result[0].id).toBe("r1");
    expect(result[0].count).toBe(3);
    expect(result[1].id).toBe("r2");
    expect(result[1].count).toBe(2);
  });

  test("limits to top 5", () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      id: `r${i}`, name: `Recipe ${i}`,
    }));
    expect(calculateMostCooked(history)).toHaveLength(5);
  });

  test("skips entries without ID", () => {
    const history = [
      { name: "No ID" },
      { id: "r1", name: "Has ID" },
    ];
    expect(calculateMostCooked(history)).toHaveLength(1);
  });
});

describe("Last 7 days frequency", () => {
  test("returns 7 days", () => {
    expect(calculateLast7([])).toHaveLength(7);
  });

  test("empty history gives all zeros", () => {
    const days = calculateLast7([]);
    days.forEach((d) => expect(d.count).toBe(0));
  });

  test("each day has a label", () => {
    const days = calculateLast7([]);
    days.forEach((d) => {
      expect(d.label).toBeTruthy();
      expect(d.label.length).toBeGreaterThan(0);
    });
  });

  test("counts cooks on the right day", () => {
    const today = new Date().toISOString().slice(0, 10);
    const history = [
      { cookedAt: today + "T10:00:00Z" },
      { cookedAt: today + "T15:00:00Z" },
    ];
    const days = calculateLast7(history);
    expect(days[6].count).toBe(2); // today is last element
  });
});

describe("Mood counts", () => {
  test("empty history", () => {
    expect(calculateMoodCounts([])).toEqual([]);
  });

  test("counts moods", () => {
    const history = [
      { mood: "happy", rating: 5 },
      { mood: "happy", rating: 4 },
      { mood: "sad", rating: 3 },
    ];
    const result = calculateMoodCounts(history);
    expect(result[0]).toEqual(["happy", 2]);
    expect(result[1]).toEqual(["sad", 1]);
  });

  test("limits to 6 moods", () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      mood: `mood${i}`, rating: 3,
    }));
    expect(calculateMoodCounts(history).length).toBeLessThanOrEqual(6);
  });

  test("skips null moods", () => {
    const history = [
      { mood: null, rating: 3 },
      { mood: "happy", rating: 5 },
    ];
    expect(calculateMoodCounts(history)).toEqual([["happy", 1]]);
  });
});

describe("Average rating", () => {
  test("empty history returns null", () => {
    expect(calculateAvgRating([])).toBeNull();
  });

  test("calculates average correctly", () => {
    expect(calculateAvgRating([{ rating: 4 }, { rating: 5 }, { rating: 3 }])).toBe("4.0");
  });

  test("single rating", () => {
    expect(calculateAvgRating([{ rating: 5 }])).toBe("5.0");
  });

  test("returns one decimal place", () => {
    expect(calculateAvgRating([{ rating: 3 }, { rating: 4 }])).toBe("3.5");
  });
});
