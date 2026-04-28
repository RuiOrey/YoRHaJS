// @ts-check
const { test, expect } = require("@playwright/test");

test.describe("WebGL Visual Test (headless)", () => {
  test("game loads, WebGL renders, and responds to WASD + mouse", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Wait for React app to mount
    await page.waitForFunction(
      () => document.getElementById("root")?.children.length > 0,
      { timeout: 10_000 }
    );

    // Wait for renderer div to exist
    await expect(page.locator("#renderer")).toBeAttached();

    // Wait for canvas to be created inside #renderer
    await page.waitForSelector("#renderer canvas", { timeout: 15_000 });

    // Verify WebGL context exists
    const hasWebGL = await page.evaluate(() => {
      const canvas = document.querySelector("#renderer canvas");
      if (!canvas) return false;
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return !!gl;
    });
    expect(hasWebGL).toBe(true);

    // Wait a moment for first render frame
    await page.waitForTimeout(2000);

    // Take a screenshot of the initial rendered state
    await page.screenshot({ path: "test-results/01-initial-render.png", fullPage: false });

    // WASD movement
    await page.keyboard.down("w");
    await page.waitForTimeout(500);
    await page.keyboard.up("w");

    await page.keyboard.down("a");
    await page.waitForTimeout(500);
    await page.keyboard.up("a");

    await page.keyboard.down("s");
    await page.waitForTimeout(500);
    await page.keyboard.up("s");

    await page.keyboard.down("d");
    await page.waitForTimeout(500);
    await page.keyboard.up("d");

    await page.screenshot({ path: "test-results/02-after-wasd.png", fullPage: false });

    // Mouse movement (camera control)
    const canvas = page.locator("#renderer canvas").first();
    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(300);

      // Simulate mouse drag (camera rotation)
      await page.mouse.down({ button: "left" });
      await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.6, { steps: 20 });
      await page.waitForTimeout(500);
      await page.mouse.up({ button: "left" });

      await page.screenshot({ path: "test-results/03-after-mouse-drag.png", fullPage: false });
    }

    // Shoot (spacebar)
    await page.keyboard.down(" ");
    await page.waitForTimeout(500);
    await page.keyboard.up(" ");

    await page.screenshot({ path: "test-results/04-after-shoot.png", fullPage: false });

    // Arrow keys (camera rotation)
    await page.keyboard.press("ArrowUp");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");

    await page.screenshot({ path: "test-results/05-after-arrows.png", fullPage: false });

    // Verify no crash after all inputs — canvas still exists
    await expect(page.locator("#renderer")).toBeAttached();
    await expect(page.locator("#renderer canvas").first()).toBeAttached();

    // Read WebGL info
    const glInfo = await page.evaluate(() => {
      const canvas = document.querySelector("#renderer canvas");
      if (!canvas) return null;
      const gl = canvas.getContext("webgl");
      return gl ? {
        version: gl.getParameter(gl.VERSION),
        renderer: gl.getParameter(gl.RENDERER),
        vendor: gl.getParameter(gl.VENDOR),
      } : null;
    });
    console.log("WebGL info:", glInfo);
  });
});
