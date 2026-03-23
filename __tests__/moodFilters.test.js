// Test the eat-out mood filter mapping

const moodToFilter = {
  tired: "coffee", sleepy: "coffee",
  happy: "dessert", joyful: "dessert",
  sad: "cozy", heartbroken: "cozy",
  anxious: "cozy", stressed: "cozy",
  romantic: "romantic", flirty: "romantic", "date-night": "romantic",
  calm: "coffee", peaceful: "coffee",
  curious: "international",
  adventurous: "international",
  angry: "spicy", hangry: "fast",
  focused: "healthy", productive: "healthy",
  social: "bar", celebrating: "steakhouse",
  lonely: "diner",
  lazy: "brunch", chill: "brunch",
  overwhelmed: "cozy",
  rushed: "fast", excited: "dessert", energetic: "bar",
};

const moodFilters = [
  { key: "all", label: "🍽️ All", search: "restaurants" },
  { key: "cozy", label: "🛋️ Cozy", search: "cafe" },
  { key: "romantic", label: "💘 Date Night", search: "fine dining" },
  { key: "coffee", label: "☕ Coffee", search: "coffee shop" },
  { key: "brunch", label: "🥞 Brunch", search: "brunch" },
  { key: "healthy", label: "🥗 Healthy", search: "salad bar" },
  { key: "fast", label: "🍔 Quick Bites", search: "fast food" },
  { key: "spicy", label: "🌶️ Spicy", search: "thai food" },
  { key: "dessert", label: "🍰 Dessert", search: "bakery" },
  { key: "bar", label: "🍸 Drinks", search: "cocktail bar" },
  { key: "international", label: "🌍 World Food", search: "world cuisine" },
  { key: "diner", label: "🍳 Diner", search: "diner" },
  { key: "steakhouse", label: "🥩 Steak", search: "steakhouse" },
  { key: "sushi", label: "🍣 Sushi", search: "sushi" },
  { key: "pizza", label: "🍕 Pizza", search: "pizza" },
  { key: "chinese", label: "🥡 Chinese", search: "chinese food" },
  { key: "indian", label: "🍛 Indian", search: "indian food" },
  { key: "mexican", label: "🌮 Mexican", search: "mexican food" },
];

const filterKeys = new Set(moodFilters.map((f) => f.key));

describe("Eat-out mood filter mapping", () => {
  test("every mood maps to a valid filter key", () => {
    Object.entries(moodToFilter).forEach(([mood, filterKey]) => {
      expect(filterKeys.has(filterKey)).toBe(true);
    });
  });

  test("every filter has a non-empty search term", () => {
    moodFilters.forEach((f) => {
      expect(f.search.length).toBeGreaterThan(0);
    });
  });

  test("every filter has a label with an emoji", () => {
    moodFilters.forEach((f) => {
      expect(f.label.length).toBeGreaterThan(2);
    });
  });

  test("no duplicate filter keys", () => {
    const keys = moodFilters.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test("comfort moods map to cozy filter", () => {
    expect(moodToFilter["sad"]).toBe("cozy");
    expect(moodToFilter["anxious"]).toBe("cozy");
    expect(moodToFilter["overwhelmed"]).toBe("cozy");
    expect(moodToFilter["heartbroken"]).toBe("cozy");
  });

  test("romantic moods map to romantic filter", () => {
    expect(moodToFilter["romantic"]).toBe("romantic");
    expect(moodToFilter["flirty"]).toBe("romantic");
    expect(moodToFilter["date-night"]).toBe("romantic");
  });

  test("rushed/hangry moods map to fast food", () => {
    expect(moodToFilter["rushed"]).toBe("fast");
    expect(moodToFilter["hangry"]).toBe("fast");
  });
});
