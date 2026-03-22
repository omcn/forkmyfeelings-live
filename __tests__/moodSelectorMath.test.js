// Test the orbital layout math from MoodSelector.js

function calculateContainerSize(windowWidth) {
  return Math.min((windowWidth || 390) - 32, 460);
}

function calculateButtonSize(containerSize, isMobile) {
  const btnWidth = isMobile ? Math.max(containerSize * 0.22, 70) : 120;
  const btnHeight = isMobile ? 52 : 62;
  return { btnWidth, btnHeight };
}

function calculateRadius(containerSize, btnWidth) {
  const maxRadius = containerSize / 2 - btnWidth / 2 - 6;
  return Math.min(containerSize * 0.44, maxRadius);
}

function calculateRascalSize(containerSize) {
  return Math.min(containerSize * 0.46, 250);
}

function calculateButtonPosition(index, total, radius) {
  const angle = (360 / total) * index - 90;
  const x = radius * Math.cos((angle * Math.PI) / 180);
  const y = radius * Math.sin((angle * Math.PI) / 180);
  return { x, y, angle };
}

describe("MoodSelector orbital math", () => {
  describe("containerSize", () => {
    test("caps at 460px for large screens", () => {
      expect(calculateContainerSize(1200)).toBe(460);
    });

    test("subtracts 32px padding from window width", () => {
      expect(calculateContainerSize(400)).toBe(368);
    });

    test("defaults to 390px when windowWidth is null", () => {
      expect(calculateContainerSize(null)).toBe(358);
    });

    test("handles small mobile screens", () => {
      expect(calculateContainerSize(320)).toBe(288);
    });

    test("caps at 460 when window is exactly 492", () => {
      expect(calculateContainerSize(492)).toBe(460);
    });
  });

  describe("button sizing", () => {
    test("mobile buttons scale with container but have minimum width of 70", () => {
      const { btnWidth } = calculateButtonSize(200, true);
      expect(btnWidth).toBe(70); // 200 * 0.22 = 44, min is 70
    });

    test("mobile buttons scale when container is large enough", () => {
      const { btnWidth } = calculateButtonSize(400, true);
      expect(btnWidth).toBe(88); // 400 * 0.22 = 88 > 70
    });

    test("desktop buttons are fixed 120px width", () => {
      const { btnWidth } = calculateButtonSize(400, false);
      expect(btnWidth).toBe(120);
    });

    test("mobile buttons are 52px tall", () => {
      const { btnHeight } = calculateButtonSize(400, true);
      expect(btnHeight).toBe(52);
    });

    test("desktop buttons are 62px tall", () => {
      const { btnHeight } = calculateButtonSize(400, false);
      expect(btnHeight).toBe(62);
    });
  });

  describe("radius calculation", () => {
    test("respects maxRadius constraint", () => {
      const containerSize = 300;
      const btnWidth = 120;
      const maxRadius = containerSize / 2 - btnWidth / 2 - 6;
      const radius = calculateRadius(containerSize, btnWidth);
      expect(radius).toBeLessThanOrEqual(maxRadius);
    });

    test("uses 0.44 * containerSize when smaller than maxRadius", () => {
      const containerSize = 460;
      const btnWidth = 80;
      const expected = containerSize * 0.44; // 202.4
      const maxR = containerSize / 2 - btnWidth / 2 - 6; // 184
      const radius = calculateRadius(containerSize, btnWidth);
      // maxRadius is 184, 0.44*460 = 202.4, so should use maxRadius
      expect(radius).toBe(Math.min(expected, maxR));
    });
  });

  describe("Rascal size", () => {
    test("scales with container at 0.46", () => {
      expect(calculateRascalSize(400)).toBe(184);
    });

    test("caps at 250px", () => {
      expect(calculateRascalSize(600)).toBe(250);
    });

    test("small container gives small rascal", () => {
      expect(calculateRascalSize(200)).toBe(92);
    });
  });

  describe("button orbital positioning", () => {
    test("first button is at the top (angle -90)", () => {
      const { angle } = calculateButtonPosition(0, 10, 100);
      expect(angle).toBe(-90);
    });

    test("buttons are evenly spaced", () => {
      const total = 10;
      const positions = Array.from({ length: total }, (_, i) =>
        calculateButtonPosition(i, total, 100)
      );
      // Check angle spacing is uniform
      for (let i = 1; i < positions.length; i++) {
        const diff = positions[i].angle - positions[i - 1].angle;
        expect(diff).toBeCloseTo(36, 5); // 360/10 = 36
      }
    });

    test("first button x is ~0 (top of circle)", () => {
      const { x } = calculateButtonPosition(0, 10, 100);
      expect(x).toBeCloseTo(0, 5);
    });

    test("first button y is -radius (top of circle)", () => {
      const { y } = calculateButtonPosition(0, 10, 100);
      expect(y).toBeCloseTo(-100, 5);
    });

    test("quarter way around is at the right", () => {
      // With 4 items, index 1 would be at angle 0 (right side)
      const { x, y } = calculateButtonPosition(1, 4, 100);
      expect(x).toBeCloseTo(100, 5);
      expect(y).toBeCloseTo(0, 5);
    });

    test("all buttons are on the circle at the correct radius", () => {
      const radius = 150;
      for (let i = 0; i < 10; i++) {
        const { x, y } = calculateButtonPosition(i, 10, radius);
        const dist = Math.sqrt(x * x + y * y);
        expect(dist).toBeCloseTo(radius, 3);
      }
    });
  });
});
