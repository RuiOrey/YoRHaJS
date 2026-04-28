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
  // WebGL context errors are expected in headless environments
  /Error creating WebGL context/i,
  /WebGL not available/i,
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

    page.on("console", (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      });
    });

    page.on("pageerror", (error) => {
      pageErrors.push({
        message: error.message,
        stack: error.stack,
      });
    });
  });

  test("should load the page without unexpected console errors", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for React to mount (check for #root children)
    await page.waitForFunction(
      () => document.getElementById("root")?.children.length > 0,
      { timeout: 10_000 }
    );

    // Wait a bit for deferred errors
    await page.waitForTimeout(3_000);

    // Check for uncaught exceptions (excluding WebGL fallback warnings)
    const unexpectedPageErrors = pageErrors.filter(
      (err) => !IGNORED_PATTERNS.some((p) => p.test(err.message))
    );

    if (unexpectedPageErrors.length > 0) {
      const errorDetails = unexpectedPageErrors
        .map((e) => `  - ${e.message}`)
        .join("\n");
      test.fail(true, `Uncaught page errors detected:\n${errorDetails}`);
    }

    // Check for unexpected console errors
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

    // Log summary
    const errorCount = consoleMessages.filter((m) => m.type === "error").length;
    const warningCount = consoleMessages.filter(
      (m) => m.type === "warning"
    ).length;
    const ignoredCount = consoleMessages.filter((m) => isIgnored(m)).length;

    console.log(
      `Console summary: ${errorCount} errors, ${warningCount} warnings, ${ignoredCount} ignored`
    );
  });

  test("should have the game container rendered", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Verify the React app mounts
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return root && root.children.length > 0;
      },
      { timeout: 10_000 }
    );

    // Check for game container elements
    const hasApp = await page.$(".App");
    const hasRenderer = await page.$("#renderer");
    const hasScene = await page.$("#scene");

    expect(hasApp).toBeTruthy();
    expect(hasRenderer).toBeTruthy();
    expect(hasScene).toBeTruthy();
  });

  test("should respond to keyboard input without errors", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for app to mount
    await page.waitForFunction(
      () => document.getElementById("root")?.children.length > 0,
      { timeout: 10_000 }
    );

    // Clear initial console messages
    consoleMessages = [];
    pageErrors = [];

    // Simulate game input
    await page.keyboard.press("w");
    await page.keyboard.press("a");
    await page.keyboard.press("s");
    await page.keyboard.press("d");
    await page.keyboard.press(" ");
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowLeft");

    await page.waitForTimeout(1_000);

    // Check no new errors appeared from input
    const unexpectedErrors = pageErrors.filter(
      (err) => !IGNORED_PATTERNS.some((p) => p.test(err.message))
    );

    if (unexpectedErrors.length > 0) {
      const errorDetails = unexpectedErrors
        .map((e) => `  - ${e.message}`)
        .join("\n");
      test.fail(true, `Errors after keyboard input:\n${errorDetails}`);
    }
  });
});
