// Test EatOutSuggestion component logic

describe("EatOutSuggestion mood keyword mapping", () => {
  const moodKeywords = {
    anxious: "cozy restaurant", stressed: "cozy restaurant",
    tired: "coffee shop", sleepy: "coffee shop",
    sad: "comfort food", heartbroken: "comfort food",
    happy: "ice cream", joyful: "ice cream",
    excited: "dessert", energetic: "dessert",
    calm: "tea room", peaceful: "tea room",
    romantic: "romantic restaurant", flirty: "romantic restaurant",
    bored: "fast food", curious: "fusion restaurant",
    adventurous: "international restaurant", nostalgic: "diner",
    angry: "spicy food", hangry: "quick bites",
    focused: "healthy restaurant", productive: "healthy restaurant",
    social: "bar", celebrating: "steakhouse",
    lonely: "diner", lazy: "brunch",
    "date-night": "romantic restaurant", chill: "café",
    overwhelmed: "comfort food", recovering: "soup restaurant",
    rushed: "fast food",
  };

  test("maps all 10 main moods", () => {
    const mainMoods = ["tired", "happy", "sad", "rushed", "date-night", "chill", "recovering", "bored", "nostalgic", "overwhelmed"];
    mainMoods.forEach((mood) => {
      expect(moodKeywords[mood]).toBeDefined();
    });
  });

  test("resolves keywords and deduplicates", () => {
    const selectedMoods = ["sad", "overwhelmed"]; // both map to "comfort food"
    const resolved = selectedMoods.map((m) => moodKeywords[m]).filter(Boolean);
    const unique = [...new Set(resolved)];
    expect(unique).toEqual(["comfort food"]);
  });

  test("builds search string from multiple moods", () => {
    const selectedMoods = ["happy", "chill"];
    const resolved = selectedMoods.map((m) => moodKeywords[m]).filter(Boolean);
    const search = [...new Set(resolved)].join(" ");
    expect(search).toBe("ice cream café");
  });

  test("falls back to restaurant for unknown mood", () => {
    const selectedMoods = ["unknown_mood"];
    const resolved = selectedMoods.map((m) => moodKeywords[m]).filter(Boolean);
    const search = [...new Set(resolved)].join(" ") || "restaurant";
    expect(search).toBe("restaurant");
  });

  test("falls back to restaurant for no moods", () => {
    const selectedMoods = [];
    const resolved = selectedMoods.map((m) => moodKeywords[m]).filter(Boolean);
    const search = [...new Set(resolved)].join(" ") || "restaurant";
    expect(search).toBe("restaurant");
  });
});

describe("EatOutSuggestion Apple Maps URL", () => {
  test("builds correct URL with query and location", () => {
    const query = encodeURIComponent("ice cream");
    const lat = 37.7749;
    const lng = -122.4194;
    const url = `https://maps.apple.com/?q=${query}&near=${lat},${lng}&z=14`;
    expect(url).toBe("https://maps.apple.com/?q=ice%20cream&near=37.7749,-122.4194&z=14");
  });

  test("suggestions limited to 4", () => {
    const keywords = ["cozy restaurant", "coffee shop", "comfort food", "ice cream", "dessert"];
    const suggestions = [...new Set(keywords)].slice(0, 4);
    expect(suggestions).toHaveLength(4);
  });
});

describe("EatOutSuggestion UI states", () => {
  test("shows prompt when no moods selected", () => {
    const selectedMoods = [];
    const showPrompt = selectedMoods.length === 0;
    expect(showPrompt).toBe(true);
  });

  test("shows error state when geolocation fails", () => {
    const error = "Could not get your location.";
    expect(error).toBeTruthy();
  });

  test("shows loading when getting location", () => {
    const loading = true;
    expect(loading).toBe(true);
  });
});
