// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Known warnings/errors to filter out — same list as browser-console.spec.js
 */
const IGNORED_PATTERNS = [
  /The AudioContext was not allowed to start/i,
  /Autoplay policy/i,
  /user gesture/i,
  /yorha/i,
  /autoprefixer/i,
  /Replace color-adjust to print-color-adjust/i,
  /THREE\.WebGLRenderer: .+ has been removed/i,
  /THREE\.Matrix4: .+ has been removed/i,
  /THREE\.WebGLRenderer: ImageBitmap requires/i,
  /Warning:.*legacy context/i,
  /Warning:.*findDOMNode is deprecated/i,
  /DevTools failed to load/i,
  /\[webpack\.hot\]/i,
];

function isIgnored(message) {
  const text = message.text();
  return IGNORED_PATTERNS.some((pattern) => pattern.test(text));
}

test.describe("Gameplay Smoke Test", () => {
  let consoleMessages = [];
  let pageErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleMessages = [];
    pageErrors = [];

    page.on("console", (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
      });
    });

    page.on("pageerror", (error) => {
      pageErrors.push({
        message: error.message,
        stack: error.stack,
      });
    });
  });

  /**
   * Helper: wait for the game to fully initialize
   */
  async function waitForGameReady(page) {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for the Three.js canvas to be visible
    await page.waitForSelector("canvas", {
      state: "visible",
      timeout: 15_000,
    });

    // Confirm the renderer container is present
    await expect(page.locator("#renderer")).toBeVisible();

    // Give the game loop a moment to stabilize
    await page.waitForTimeout(2_000);
  }

  test("should handle WASD keyboard input without crashing", async ({
    page,
  }) => {
    await waitForGameReady(page);

    // Clear console messages collected during initialization
    consoleMessages = [];
    pageErrors = [];

    // Simulate WASD movement keys
    const movementKeys = ["w", "a", "s", "d"];
    for (const key of movementKeys) {
      await page.keyboard.down(key);
      await page.waitForTimeout(200);
      await page.keyboard.up(key);
    }

    // Allow game loop to process input
    await page.waitForTimeout(1_000);

    // Verify no new errors appeared from input handling
    const newErrors = consoleMessages.filter(
      (msg) =>
        (msg.type === "error" || msg.type === "warning") && !isIgnored(msg)
    );

    expect(newErrors).toHaveLength(0);

    // Verify canvas is still visible (game didn't crash)
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("should handle spacebar (shoot) input without crashing", async ({
    page,
  }) => {
    await waitForGameReady(page);

    // Clear console messages collected during initialization
    consoleMessages = [];
    pageErrors = [];

    // Simulate shooting (spacebar)
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);

    // Press space a few more times to simulate rapid fire
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press("Space");
      await page.waitForTimeout(300);
    }

    // Allow game loop to process
    await page.waitForTimeout(1_000);

    // Verify no errors from shooting mechanic
    const newErrors = consoleMessages.filter(
      (msg) =>
        (msg.type === "error" || msg.type === "warning") && !isIgnored(msg)
    );

    expect(newErrors).toHaveLength(0);

    // Verify canvas is still rendering
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });

  test("should handle combined movement and shooting without errors", async ({
    page,
  }) => {
    await waitForGameReady(page);

    // Clear console messages
    consoleMessages = [];
    pageErrors = [];

    // Simulate moving while shooting
    await page.keyboard.down("w");
    await page.waitForTimeout(200);

    await page.keyboard.press("Space");
    await page.waitForTimeout(300);

    await page.keyboard.down("d");
    await page.waitForTimeout(200);

    await page.keyboard.press("Space");
    await page.waitForTimeout(300);

    await page.keyboard.up("w");
    await page.keyboard.up("d");

    // Allow game loop to process
    await page.waitForTimeout(1_000);

    // Verify no errors
    const newErrors = consoleMessages.filter(
      (msg) =>
        (msg.type === "error" || msg.type === "warning") && !isIgnored(msg)
    );

    expect(newErrors).toHaveLength(0);

    // Verify canvas is still rendering
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Verify no uncaught exceptions
    const unexpectedPageErrors = pageErrors.filter(
      (err) => !IGNORED_PATTERNS.some((p) => p.test(err.message))
    );
    expect(unexpectedPageErrors).toHaveLength(0);
  });

  test("should handle arrow keys as alternative movement input", async ({
    page,
  }) => {
    await waitForGameReady(page);

    // Clear console messages
    consoleMessages = [];
    pageErrors = [];

    // Simulate arrow key movement
    const arrowKeys = ["ArrowUp", "ArrowLeft", "ArrowDown", "ArrowRight"];
    for (const key of arrowKeys) {
      await page.keyboard.press(key);
      await page.waitForTimeout(200);
    }

    // Allow game loop to process
    await page.waitForTimeout(1_000);

    // Verify no errors
    const newErrors = consoleMessages.filter(
      (msg) =>
        (msg.type === "error" || msg.type === "warning") && !isIgnored(msg)
    );

    expect(newErrors).toHaveLength(0);

    // Verify canvas is still rendering
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();
  });
});
