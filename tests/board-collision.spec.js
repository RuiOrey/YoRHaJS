// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Board Collision Tests", () => {
  test("player cannot walk off the board", async ({ page }) => {
    const errors = [];
    const warnings = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (msg.type() === "error") {
        errors.push(text);
        console.log(`[Console Error] ${text}`);
      } else if (msg.type() === "warning") {
        warnings.push(text);
      }
    });

    page.on("pageerror", (err) => {
      errors.push(err.message);
      console.log(`[Page Error] ${err.message}`);
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for React app to mount
    await page.waitForFunction(
      () => document.getElementById("root")?.children.length > 0,
      { timeout: 10_000 }
    );

    // Wait for game loop and physics to initialize
    await page.waitForTimeout(2000);

    // Check if WebGL context was created
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector("canvas");
      if (!canvas) return false;
      const gl =
        canvas.getContext("webgl2") || canvas.getContext("webgl");
      return !!gl;
    });

    if (!hasWebGL) {
      console.warn("WebGL not available — skipping position-based assertions");
      test.skip(true, "WebGL not available in this browser environment");
      return;
    }

    console.log("WebGL is available — proceeding with collision test");

    // Wait for player physics body to be created
    await page.waitForFunction(
      () => {
        if (typeof window.__PLAYER_POSITION__ !== "function") return false;
        const pos = window.__PLAYER_POSITION__();
        return pos !== null;
      },
      { timeout: 5_000 }
    );

    const getPlayerPos = async () => {
      return page.evaluate(() => {
        const pos = window.__PLAYER_POSITION__();
        return pos ? { x: pos.x, y: pos.y, z: pos.z } : null;
      });
    };

    const initialPos = await getPlayerPos();
    console.log("Initial player position:", initialPos);
    expect(initialPos).not.toBeNull();

    // Board is 100x100 with walls at ±50.
    // Player body (shooterGeometry) has dimensions 2x2x2 -> half-extent ≈ 1.
    // Allow a small physics-penetration tolerance.
    const MAX_POS = 50.5;

    /**
     * Presses a key for 2 seconds, then verifies the player stays in bounds.
     */
    const testMovement = async (key, label) => {
      await page.keyboard.down(key);
      await page.waitForTimeout(2000);
      await page.keyboard.up(key);
      // Let physics settle one extra frame
      await page.waitForTimeout(200);

      const pos = await getPlayerPos();
      console.log(`After ${label} (${key}):`, pos);

      expect(pos).not.toBeNull();
      expect(Math.abs(pos.x)).toBeLessThanOrEqual(MAX_POS);
      expect(Math.abs(pos.y)).toBeLessThanOrEqual(MAX_POS);
    };

    // 1. Move up (positive Y) toward top wall
    await testMovement("w", "up");

    // 2. Move down (negative Y) toward bottom wall
    await testMovement("s", "down");

    // 3. Move left (negative X) toward left wall
    await testMovement("a", "left");

    // 4. Move right (positive X) toward right wall
    await testMovement("d", "right");

    // Final position sanity check
    const finalPos = await getPlayerPos();
    console.log("Final player position:", finalPos);
    expect(Math.abs(finalPos.x)).toBeLessThanOrEqual(MAX_POS);
    expect(Math.abs(finalPos.y)).toBeLessThanOrEqual(MAX_POS);

    // Ensure no critical WebGL / Three.js errors occurred
    const criticalErrors = errors.filter((e) =>
      /webgl|shader|context|three\.js/i.test(e)
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
