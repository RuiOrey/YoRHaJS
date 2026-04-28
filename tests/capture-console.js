// @ts-check
// Standalone script to capture browser console errors from the running game.
// Usage: node tests/capture-console.js
const { chromium } = require("playwright");

const IGNORED_PATTERNS = [
  /The AudioContext was not allowed to start/i,
  /Autoplay policy/i,
  /user gesture/i,
  /autoprefixer/i,
  /color-adjust/i,
  /DevTools failed to load/i,
  /\[webpack\.hot\]/i,
  /WebGL not available/i,
  /Error creating WebGL context/i,
];

function isIgnored(text) {
  return IGNORED_PATTERNS.some((p) => p.test(text));
}

(async () => {
  console.log("=== Browser Console Capture ===");

  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();
  let errorCount = 0;
  let warningCount = 0;
  let ignoredCount = 0;

  page.on("console", (msg) => {
    const text = msg.text();
    const type = msg.type();

    if (isIgnored(text)) {
      ignoredCount++;
      return;
    }

    if (type === "error") {
      errorCount++;
      console.error(`[ERROR] ${text}`);
      const loc = msg.location();
      if (loc && loc.url) {
        const file = loc.url.split("/").pop().split("?")[0];
        console.error(`  -> ${file}:${loc.lineNumber}:${loc.columnNumber}`);
      }
    } else if (type === "warning") {
      warningCount++;
      console.warn(`[WARN]  ${text}`);
    } else if (type === "log") {
      console.log(`[LOG]   ${text}`);
    }
  });

  page.on("pageerror", (err) => {
    errorCount++;
    console.error(`[PAGE ERROR] ${err.message}`);
    if (err.stack) {
      console.error(`  Stack: ${err.stack.split("\n").slice(0, 3).join("\n  ")}`);
    }
  });

  console.log("Navigating to http://127.0.0.1:3000...");
  await page.goto("http://127.0.0.1:3000", {
    waitUntil: "commit",
    timeout: 10_000,
  });

  console.log("Page loaded. Capturing console for 8 seconds...\n");
  await page.waitForTimeout(8_000);

  console.log("\n=== Console Capture Summary ===");
  console.log(`Errors:   ${errorCount}`);
  console.log(`Warnings: ${warningCount}`);
  console.log(`Ignored:  ${ignoredCount}`);

  if (errorCount > 0) {
    console.log("\n⚠️  There are console errors that need fixing!");
    process.exit(1);
  } else {
    console.log("\n✅ No unexpected console errors detected.");
    process.exit(0);
  }
})().catch((err) => {
  console.error("Script failed:", err.message);
  process.exit(2);
});
