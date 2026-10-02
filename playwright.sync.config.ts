import { defineConfig, devices } from "@playwright/test";

import { localSupabase } from "./e2e/sync/localSupabase";

const PORT = 4174;
const isCi = Boolean(process.env.CI);

// For machines with a preinstalled Chromium that doesn't match this Playwright version.
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

// The local stack (`pnpm supabase start`) must be running: its URL and keys come from it.
const { url, publishableKey } = localSupabase();

/** Sync end-to-end tests: the app built against the local Supabase stack, two devices at a time. */
export default defineConfig({
  testDir: "e2e/sync",
  // For the @/ alias: the tests build their data with src/test/builders.ts.
  tsconfig: "./tsconfig.node.json",
  // Tests share one local stack but each signs in as its own user, so they can run in parallel.
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
  // Its own build and port, so it never mixes with the signed-out build of `pnpm test:e2e`.
  webServer: {
    command: `pnpm exec vite build --outDir dist-sync && pnpm exec vite preview --outDir dist-sync --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
    // Variables already in the environment win over .env files, so a local .env can't leak in.
    env: {
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    },
  },
});
