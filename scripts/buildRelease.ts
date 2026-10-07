// Builds the production-shaped site the release checks audit, into build-release/: the canonical
// address, public indexing on, and no PostHog key, so nothing it serves sends a live event. It's a
// local test artifact, never deployed. Run by `pnpm build:release` (and `pnpm test:lighthouse`).

import { execFileSync } from "node:child_process";
import process from "node:process";

export const RELEASE_BUILD_DIRECTORY = "build-release";

// Variables already in the environment win over .env files, so a local .env can't leak in.
const RELEASE_ENV = {
  ...process.env,
  BUILD_DIRECTORY: RELEASE_BUILD_DIRECTORY,
  VITE_SITE_URL: "https://dsa-learning.bernardosevero.dev",
  VITE_PUBLIC_INDEXING_ENABLED: "true",
  VITE_POSTHOG_KEY: "",
  VITE_SUPABASE_URL: "",
  VITE_SUPABASE_PUBLISHABLE_KEY: "",
};

function run(command: string, args: readonly string[]): void {
  execFileSync(command, args, { env: RELEASE_ENV, stdio: "inherit" });
}

run("pnpm", ["exec", "react-router", "build"]);
run("pnpm", ["exec", "tsx", "scripts/static-output.ts", RELEASE_BUILD_DIRECTORY]);
