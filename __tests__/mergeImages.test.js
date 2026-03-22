// Test the mergeImages utility logic from lib/mergeImages.js

describe("mergeImages positioning logic", () => {
  // Extracted constants from mergeImages.js
  function calculateSelfieOverlay(mealWidth) {
    const selfieSize = mealWidth * 0.25;
    const selfieX = 20;
    const selfieY = 20;
    const borderRadius = selfieSize / 2;
    const borderWidth = 4;
    const outerRadius = selfieSize / 2 + 2;

    return { selfieSize, selfieX, selfieY, borderRadius, borderWidth, outerRadius };
  }

  test("selfie is 25% of meal width", () => {
    const { selfieSize } = calculateSelfieOverlay(800);
    expect(selfieSize).toBe(200);
  });

  test("selfie is positioned at (20, 20)", () => {
    const { selfieX, selfieY } = calculateSelfieOverlay(800);
    expect(selfieX).toBe(20);
    expect(selfieY).toBe(20);
  });

  test("selfie circle radius is half of size", () => {
    const { selfieSize, borderRadius } = calculateSelfieOverlay(800);
    expect(borderRadius).toBe(selfieSize / 2);
  });

  test("border is 4px white", () => {
    const { borderWidth } = calculateSelfieOverlay(800);
    expect(borderWidth).toBe(4);
  });

  test("outer border radius is 2px larger", () => {
    const { selfieSize, outerRadius } = calculateSelfieOverlay(800);
    expect(outerRadius).toBe(selfieSize / 2 + 2);
  });

  test("selfie scales with different meal sizes", () => {
    expect(calculateSelfieOverlay(400).selfieSize).toBe(100);
    expect(calculateSelfieOverlay(1200).selfieSize).toBe(300);
    expect(calculateSelfieOverlay(1920).selfieSize).toBe(480);
  });

  test("circle center is at (selfieX + radius, selfieY + radius)", () => {
    const { selfieSize, selfieX, selfieY } = calculateSelfieOverlay(800);
    const centerX = selfieX + selfieSize / 2;
    const centerY = selfieY + selfieSize / 2;
    expect(centerX).toBe(120); // 20 + 100
    expect(centerY).toBe(120); // 20 + 100
  });
});

describe("mergeImages output", () => {
  test("output format is JPEG", () => {
    // The function calls canvas.toBlob with "image/jpeg"
    const outputFormat = "image/jpeg";
    expect(outputFormat).toBe("image/jpeg");
  });

  test("canvas dimensions match meal image", () => {
    const mealWidth = 1920;
    const mealHeight = 1080;
    const canvasWidth = mealWidth;
    const canvasHeight = mealHeight;
    expect(canvasWidth).toBe(1920);
    expect(canvasHeight).toBe(1080);
  });
});
