// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * Known warnings/errors to filter out — these are external or expected:
 * - AudioContext autoplay policy (browser security, not our bug)
 * - yorha npm package warnings (external UI library)
 * - autoprefixer CSS deprecation warnings (external tooling)
 * - Three.js deprecation notices from v0.110.0 (expected for this version)
 * - React 16 legacy context warnings (expected for this version)
 */
const IGNORED_PATTERNS = [
  // AudioContext autoplay policy
  /The AudioContext was not allowed to start/i,
  /Autoplay policy/i,
  /user gesture/i,

  // yorha package warnings
  /yorha/i,

  // autoprefixer CSS warnings
  /autoprefixer/i,
  /Replace color-adjust to print-color-adjust/i,

  // Three.js v0.110.0 deprecation notices
  /THREE\.WebGLRenderer: .+ has been removed/i,
  /THREE\.Matrix4: .+ has been removed/i,
  /THREE\.WebGLRenderer: ImageBitmap requires/i,

  // React 16 legacy warnings
  /Warning:.*legacy context/i,
  /Warning:.*findDOMNode is deprecated/i,

  // Chrome dev tools / extension noise
  /DevTools failed to load/i,
  /\[webpack\.hot\]/i,
];

function isIgnored(message) {
  const text = message.text();
  return IGNORED_PATTERNS.some((pattern) => pattern.test(text));
}

test.describe("Browser Console Errors", () => {
  let consoleMessages = [];
  let pageErrors = [];

  test.beforeEach(async ({ page }) => {
    consoleMessages = [];
    pageErrors = [];

    // Capture all console messages
    page.on("console", (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      });
    });

    // Capture uncaught exceptions / page errors
    page.on("pageerror", (error) => {
      pageErrors.push({
        message: error.message,
        stack: error.stack,
      });
    });
  });

  test("should load the game without unexpected console errors", async ({
    page,
  }) => {
    // Navigate to the game
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for the game canvas to appear (indicates Three.js renderer initialized)
    const canvas = await page.waitForSelector("canvas", {
      state: "visible",
      timeout: 15_000,
    });
    expect(canvas).toBeTruthy();

    // Wait for the renderer container to confirm game loop started
    await expect(page.locator("#renderer")).toBeVisible();

    // Collect console messages for 5 seconds after page load to catch
    // deferred errors from the game loop initialization
    await page.waitForTimeout(5_000);

    // --- Check for uncaught exceptions ---
    const unexpectedPageErrors = pageErrors.filter(
      (err) => !IGNORED_PATTERNS.some((p) => p.test(err.message))
    );

    if (unexpectedPageErrors.length > 0) {
      const errorDetails = unexpectedPageErrors
        .map((e) => `  - ${e.message}`)
        .join("\n");
      test.fail(
        true,
        `Uncaught page errors detected:\n${errorDetails}`
      );
    }

    // --- Check for unexpected console errors ---
    const unexpectedErrors = consoleMessages.filter(
      (msg) =>
        (msg.type === "error" || msg.type === "warning") && !isIgnored(msg)
    );

    if (unexpectedErrors.length > 0) {
      const errorDetails = unexpectedErrors
        .map((e) => `  [${e.type}] ${e.text}`)
        .join("\n");
      test.fail(
        true,
        `Unexpected console errors/warnings detected:\n${errorDetails}`
      );
    }

    // --- Verify canvas is still rendering (not crashed) ---
    const canvasVisible = await canvas.isVisible();
    expect(canvasVisible).toBe(true);

    // Log summary for visibility in test output
    const errorCount = consoleMessages.filter((m) => m.type === "error").length;
    const warningCount = consoleMessages.filter(
      (m) => m.type === "warning"
    ).length;
    const ignoredCount = consoleMessages.filter((m) => isIgnored(m)).length;

    console.log(
      `Console summary: ${errorCount} errors, ${warningCount} warnings, ${ignoredCount} ignored`
    );
  });

  test("should have a visible canvas element after game initialization", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for canvas to be rendered by Three.js
    const canvas = await page.waitForSelector("canvas", {
      state: "visible",
      timeout: 15_000,
    });

    // Verify canvas has WebGL context attributes
    const canvasWidth = await canvas.getAttribute("width");
    const canvasHeight = await canvas.getAttribute("height");

    expect(canvasWidth).not.toBeNull();
    expect(canvasHeight).not.toBeNull();
    expect(parseInt(canvasWidth, 10)).toBeGreaterThan(0);
    expect(parseInt(canvasHeight, 10)).toBeGreaterThan(0);
  });
});
