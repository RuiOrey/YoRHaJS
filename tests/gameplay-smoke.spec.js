// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("Gameplay Smoke Tests", () => {
  test("game loads and responds to WASD movement", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for React app to mount
    await page.waitForFunction(
      () => document.getElementById("root")?.children.length > 0,
      { timeout: 10_000 }
    );

    // Verify game containers exist
    await expect(page.locator("#renderer")).toBeAttached();
    await expect(page.locator("#scene")).toBeAttached();

    // Simulate WASD movement
    await page.keyboard.down("w");
    await page.waitForTimeout(100);
    await page.keyboard.up("w");

    await page.keyboard.down("a");
    await page.waitForTimeout(100);
    await page.keyboard.up("a");

    await page.keyboard.down("s");
    await page.waitForTimeout(100);
    await page.keyboard.up("s");

    await page.keyboard.down("d");
    await page.waitForTimeout(100);
    await page.keyboard.up("d");

    // Verify no crash (containers still exist)
    await expect(page.locator("#renderer")).toBeAttached();
    await expect(page.locator("#scene")).toBeAttached();
  });

  test("game responds to spacebar (shoot) without crashing", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.waitForFunction(
      () => document.getElementById("root")?.children.length > 0,
      { timeout: 10_000 }
    );

    // Simulate shooting
    await page.keyboard.down(" ");
    await page.waitForTimeout(500);
    await page.keyboard.up(" ");

    // Verify no crash
    await expect(page.locator("#renderer")).toBeAttached();
  });

  test("game responds to arrow keys (camera rotation) without crashing", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.waitForFunction(
      () => document.getElementById("root")?.children.length > 0,
      { timeout: 10_000 }
    );

    // Simulate camera rotation
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");

    // Verify no crash
    await expect(page.locator("#renderer")).toBeAttached();
  });

  test("combined input sequence doesn't crash the game", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await page.waitForFunction(
      () => document.getElementById("root")?.children.length > 0,
      { timeout: 10_000 }
    );

    // Combined movement + shooting
    await page.keyboard.down("w");
    await page.keyboard.down(" ");
    await page.waitForTimeout(200);
    await page.keyboard.up(" ");
    await page.keyboard.up("w");

    await page.keyboard.down("a");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.up("a");

    await page.keyboard.down("d");
    await page.keyboard.down(" ");
    await page.waitForTimeout(200);
    await page.keyboard.up(" ");
    await page.keyboard.up("d");

    // Verify no crash
    await expect(page.locator("#renderer")).toBeAttached();
    await expect(page.locator("#scene")).toBeAttached();
  });
});
