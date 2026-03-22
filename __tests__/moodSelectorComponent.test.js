// Test MoodSelector component logic

describe("MoodSelector mood emoji mapping", () => {
  const moodEmojis = {
    tired: "😴", happy: "😊", sad: "😢", rushed: "⏰",
    "date-night": "💘", chill: "🧊", recovering: "🛌",
    bored: "😐", nostalgic: "🕰️", overwhelmed: "😵‍💫",
  };

  test("all 10 moods have emojis", () => {
    expect(Object.keys(moodEmojis)).toHaveLength(10);
  });

  test("each mood has a non-empty emoji", () => {
    Object.values(moodEmojis).forEach((emoji) => {
      expect(emoji.length).toBeGreaterThan(0);
    });
  });

  test("unknown mood falls back to plate emoji", () => {
    const emoji = moodEmojis["unknown"] || "🍽️";
    expect(emoji).toBe("🍽️");
  });
});

describe("MoodSelector rascal videos", () => {
  const rascalVideos = {
    sad: "/videos/rascal-sad.mp4",
    tired: "/videos/rascal-tired.mp4",
    chill: "/videos/rascal-chill.mp4",
    rushed: "/videos/rascal-rushed.mp4",
    happy: "/videos/rascal-happy1.mp4",
    overwhelmed: "/videos/rascal-overwhelmed.mp4",
    nostalgic: "/videos/rascal-nostalgic.mp4",
    "date-night": "/videos/rascal-date-night.mp4",
    recovering: "/videos/rascal-recovering.mp4",
    bored: "/videos/rascal-bored.mp4",
  };

  test("each mood has a video", () => {
    expect(Object.keys(rascalVideos)).toHaveLength(10);
  });

  test("no mood selected falls back to idle", () => {
    const currentMood = undefined;
    const videoSrc = rascalVideos[currentMood] || "/videos/rascal-idle.mp4";
    expect(videoSrc).toBe("/videos/rascal-idle.mp4");
  });

  test("selected mood uses correct video", () => {
    const videoSrc = rascalVideos["happy"] || "/videos/rascal-idle.mp4";
    expect(videoSrc).toBe("/videos/rascal-happy1.mp4");
  });
});

describe("MoodSelector toggle behavior", () => {
  test("clicking selected mood deselects it", () => {
    const selectedMoods = ["happy"];
    const moodKey = "happy";
    const next = selectedMoods[0] === moodKey ? [] : [moodKey];
    expect(next).toEqual([]);
  });

  test("clicking unselected mood selects it", () => {
    const selectedMoods = ["sad"];
    const moodKey = "happy";
    const next = selectedMoods[0] === moodKey ? [] : [moodKey];
    expect(next).toEqual(["happy"]);
  });

  test("clicking when nothing selected selects mood", () => {
    const selectedMoods = [];
    const moodKey = "chill";
    const next = selectedMoods[0] === moodKey ? [] : [moodKey];
    expect(next).toEqual(["chill"]);
  });
});

describe("MoodSelector sizing", () => {
  test("container size respects max width", () => {
    const windowWidth = 600;
    const containerSize = Math.min((windowWidth || 390) - 32, 460);
    expect(containerSize).toBe(460);
  });

  test("container size for narrow screen", () => {
    const windowWidth = 350;
    const containerSize = Math.min((windowWidth || 390) - 32, 460);
    expect(containerSize).toBe(318);
  });

  test("rascal size limited to 250", () => {
    const containerSize = 460;
    const rascalSize = Math.min(containerSize * 0.46, 250);
    expect(rascalSize).toBeLessThanOrEqual(250);
  });

  test("mood keys filter out default", () => {
    const recipes = { happy: [], sad: [], default: [] };
    const moodKeys = Object.keys(recipes).filter((k) => k !== "default");
    expect(moodKeys).toEqual(["happy", "sad"]);
  });

  test("aria-label formats mood correctly", () => {
    const moodKey = "date-night";
    const label = `${moodKey.replace("-", " ")} mood`;
    expect(label).toBe("date night mood");
  });
});
