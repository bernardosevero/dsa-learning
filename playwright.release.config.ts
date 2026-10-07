import { defineConfig, devices } from "@playwright/test";

const PORT = 4175;
const BUILD_DIRECTORY = "build-release";
const isCi = Boolean(process.env.CI);

// For machines with a preinstalled Chromium that doesn't match this Playwright version.
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

/**
 * Release checks on the production-shaped build (`pnpm build:release`: canonical address, public
 * indexing on, no analytics key). `pnpm test:e2e` covers the same pages with indexing off.
 */
export default defineConfig({
  testDir: "e2e/release",
  forbidOnly: isCi,
  reporter: isCi ? [["html", { open: "never" }], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions:
          chromiumExecutable === undefined ? {} : { executablePath: chromiumExecutable },
      },
    },
  ],
  // Its own build and port, so it never mixes with the unindexed build of `pnpm test:e2e`.
  webServer: {
    command: `pnpm build:release && pnpm exec wrangler dev --local --assets ${BUILD_DIRECTORY}/client --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCi,
    timeout: 180_000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
