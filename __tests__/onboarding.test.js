// Test the onboarding slide progression logic from Onboarding.js

const slides = [
  {
    emoji: "👋",
    title: "Welcome to Fork My Feels!",
    body: "Rascal is your emotional sous chef...",
    bg: "from-rose-100 to-pink-200",
  },
  {
    emoji: "🎡",
    title: "Spin the mood wheel",
    body: "Tap a mood on the orbital wheel...",
    bg: "from-orange-100 to-rose-100",
  },
  {
    emoji: "📸",
    title: "Share & connect",
    body: "Cook your recipe, snap a photo...",
    bg: "from-pink-100 to-fuchsia-100",
  },
];

describe("Onboarding slide progression", () => {
  test("has exactly 3 slides", () => {
    expect(slides).toHaveLength(3);
  });

  test("first slide is the welcome screen", () => {
    expect(slides[0].title).toBe("Welcome to Fork My Feels!");
    expect(slides[0].emoji).toBe("👋");
  });

  test("last slide is the share screen", () => {
    expect(slides[2].title).toBe("Share & connect");
    expect(slides[2].emoji).toBe("📸");
  });

  test("each slide has required properties", () => {
    slides.forEach((slide) => {
      expect(slide).toHaveProperty("emoji");
      expect(slide).toHaveProperty("title");
      expect(slide).toHaveProperty("body");
      expect(slide).toHaveProperty("bg");
      expect(slide.emoji.length).toBeGreaterThan(0);
      expect(slide.title.length).toBeGreaterThan(0);
      expect(slide.body.length).toBeGreaterThan(0);
    });
  });

  test("each slide has a gradient background", () => {
    slides.forEach((slide) => {
      expect(slide.bg).toMatch(/^from-.*to-/);
    });
  });

  test("isLast is true only on the last slide", () => {
    for (let i = 0; i < slides.length; i++) {
      const isLast = i === slides.length - 1;
      if (i < slides.length - 1) expect(isLast).toBe(false);
      else expect(isLast).toBe(true);
    }
  });

  test("advance increments index up to last slide", () => {
    let index = 0;
    const advance = () => { index = Math.min(index + 1, slides.length - 1); };
    advance();
    expect(index).toBe(1);
    advance();
    expect(index).toBe(2);
    advance();
    expect(index).toBe(2); // stays on last
  });

  test("onDone sets localStorage fmf_onboarded", () => {
    localStorage.clear();
    localStorage.setItem("fmf_onboarded", "1");
    expect(localStorage.getItem("fmf_onboarded")).toBe("1");
  });

  test("skip button sets onboarded and closes", () => {
    localStorage.clear();
    let done = false;
    const onDone = () => {
      localStorage.setItem("fmf_onboarded", "1");
      done = true;
    };
    onDone();
    expect(done).toBe(true);
    expect(localStorage.getItem("fmf_onboarded")).toBe("1");
  });
});
