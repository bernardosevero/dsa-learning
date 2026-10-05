import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;
const isCi = Boolean(process.env.CI);

// For machines with a preinstalled Chromium that doesn't match this Playwright version.
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

export default defineConfig({
  testDir: "e2e",
  // The sync tests need the local Supabase stack; they run with playwright.sync.config.ts.
  testIgnore: "sync/**",
  fullyParallel: true,
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
  // The production build served the way Cloudflare serves it (Wrangler's local static assets), so
  // the tests catch what only the bundle, the 404 page or the _redirects rules get wrong.
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
    env: { WRANGLER_SEND_METRICS: "false" },
  },
});
