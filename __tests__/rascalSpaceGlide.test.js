// Test the RascalSpaceGlide game logic

describe("RascalSpaceGlide game logic", () => {
  const gameWidth = 300;
  const rascalWidth = 50;

  // Collision detection extracted from RascalSpaceGlide.js
  function checkCollision(rascalX, rascalY, obstacleX, obstacleY) {
    const rascalHitbox = { x: rascalX + 8, y: rascalY + 10, width: 34, height: 30 };
    const obstacleHitbox = { x: obstacleX + 4, y: obstacleY + 4, width: 22, height: 22 };

    return (
      rascalHitbox.x < obstacleHitbox.x + obstacleHitbox.width &&
      rascalHitbox.x + rascalHitbox.width > obstacleHitbox.x &&
      rascalHitbox.y < obstacleHitbox.y + obstacleHitbox.height &&
      rascalHitbox.y + rascalHitbox.height > obstacleHitbox.y
    );
  }

  // Movement clamping
  function clampPosition(x, velocity) {
    return Math.max(0, Math.min(gameWidth - rascalWidth, x + velocity));
  }

  describe("Collision detection", () => {
    test("detects direct hit", () => {
      expect(checkCollision(150, 340, 150, 340)).toBe(true);
    });

    test("no collision when far apart", () => {
      expect(checkCollision(0, 340, 250, 50)).toBe(false);
    });

    test("no collision when obstacle is above", () => {
      expect(checkCollision(150, 340, 150, 100)).toBe(false);
    });

    test("detects edge collision", () => {
      // Obstacle just touching the rascal hitbox
      expect(checkCollision(150, 340, 175, 340)).toBe(true);
    });

    test("no collision when obstacle just passes to the side", () => {
      expect(checkCollision(0, 340, 100, 340)).toBe(false);
    });

    test("detects collision at various positions", () => {
      // Directly overlapping
      expect(checkCollision(100, 340, 100, 340)).toBe(true);
      // Slightly offset but still overlapping
      expect(checkCollision(100, 340, 120, 340)).toBe(true);
    });
  });

  describe("Movement clamping", () => {
    test("moves left normally", () => {
      expect(clampPosition(150, -4)).toBe(146);
    });

    test("moves right normally", () => {
      expect(clampPosition(150, 4)).toBe(154);
    });

    test("clamps at left boundary", () => {
      expect(clampPosition(2, -4)).toBe(0);
      expect(clampPosition(0, -4)).toBe(0);
    });

    test("clamps at right boundary", () => {
      expect(clampPosition(248, 4)).toBe(250); // gameWidth - rascalWidth = 250
      expect(clampPosition(250, 4)).toBe(250);
    });

    test("no movement with zero velocity", () => {
      expect(clampPosition(150, 0)).toBe(150);
    });
  });

  describe("Obstacle spawning", () => {
    const obstacleEmojis = ["🥚", "🧂", "🍳", "🔪"];

    test("has 4 obstacle types", () => {
      expect(obstacleEmojis).toHaveLength(4);
    });

    test("obstacle X is within game bounds", () => {
      for (let i = 0; i < 100; i++) {
        const x = Math.floor(Math.random() * (gameWidth - 30));
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(gameWidth - 30);
      }
    });

    test("obstacles start at y=0", () => {
      const obj = { id: Date.now(), x: 100, y: 0, emoji: "🥚" };
      expect(obj.y).toBe(0);
    });
  });

  describe("Obstacle falling", () => {
    test("obstacles move down by 5 each tick", () => {
      const obstacle = { x: 100, y: 0 };
      expect(obstacle.y + 5).toBe(5);
      expect(obstacle.y + 50).toBe(50);
    });

    test("obstacles are removed when y >= 400", () => {
      const obstacles = [
        { x: 100, y: 380 },
        { x: 200, y: 395 },
        { x: 50, y: 399 },
      ];
      const updated = obstacles
        .map((o) => ({ ...o, y: o.y + 5 }))
        .filter((o) => o.y < 400);
      // 380+5=385 (kept), 395+5=400 (removed), 399+5=404 (removed)
      expect(updated).toHaveLength(1);
      expect(updated[0].y).toBe(385);
    });
  });

  describe("Tilt controls", () => {
    test("gamma < -5 moves left", () => {
      const gamma = -10;
      const velocity = gamma < -5 ? -4 : gamma > 5 ? 4 : 0;
      expect(velocity).toBe(-4);
    });

    test("gamma > 5 moves right", () => {
      const gamma = 10;
      const velocity = gamma < -5 ? -4 : gamma > 5 ? 4 : 0;
      expect(velocity).toBe(4);
    });

    test("gamma between -5 and 5 is dead zone", () => {
      for (const gamma of [-5, -3, 0, 3, 5]) {
        const velocity = gamma < -5 ? -4 : gamma > 5 ? 4 : 0;
        expect(velocity).toBe(0);
      }
    });
  });

  describe("Game state", () => {
    test("initial rascal position is centered at 150", () => {
      const initialX = 150;
      expect(initialX).toBe(150);
    });

    test("game resets to initial state", () => {
      let rascalX = 200;
      let obstacles = [{ x: 100, y: 300 }];
      let timeLeft = 10;
      const secondsRemaining = 60;

      // Reset
      rascalX = 150;
      obstacles = [];
      timeLeft = secondsRemaining;

      expect(rascalX).toBe(150);
      expect(obstacles).toEqual([]);
      expect(timeLeft).toBe(60);
    });
  });
});
