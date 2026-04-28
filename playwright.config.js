// @ts-check
const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          executablePath: "/usr/bin/chromium",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-gpu",
          ],
        },
      },
    },
    {
      name: "firefox",
      use: {
        browserName: "firefox",
      },
    },
    {
      name: "chromium-webgl",
      use: {
        browserName: "chromium",
        launchOptions: {
          executablePath: "/usr/bin/chromium",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--use-gl=swiftshader-webgl",
            "--enable-unsafe-swiftshader",
          ],
        },
      },
    },
    {
      name: "chromium-headed",
      use: {
        browserName: "chromium",
        headless: false,
        launchOptions: {
          executablePath: "/usr/bin/chromium",
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
          ],
        },
      },
    },
    {
      name: "firefox-headed",
      use: {
        browserName: "firefox",
        headless: false,
      },
    },
  ],
  webServer: {
    command: "npm start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
  timeout: 30_000,
});
