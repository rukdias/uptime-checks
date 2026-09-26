import { defineConfig } from "@playwright/test";

// Read-only smoke tests against production. Every app scales to zero, so the
// first request can take several seconds: generous per-test timeout + 1 retry.
export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  expect: { timeout: 15_000 },
  retries: 1,
  workers: process.env.CI ? 4 : 6,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }], ["json", { outputFile: "results.json" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    browserName: "chromium",
    navigationTimeout: 25_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    {
      name: "phone",
      use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    },
  ],
});
