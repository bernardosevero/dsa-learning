import process from "node:process";

import type { Config } from "@react-router/dev/config";

// Static hosting: no server at runtime. Public pages are prerendered at build time; every practice
// path gets the client-rendered app shell (build/client/__spa-fallback.html, since / is a page).
export default {
  appDirectory: "src",
  // The sync end-to-end tests build into their own folder, so they never mix with `pnpm build`.
  buildDirectory: process.env.BUILD_DIRECTORY ?? "build",
  ssr: false,
  // /404 is rendered only to become build/client/404.html (see scripts/static-output.ts).
  prerender: ["/", "/how-it-works", "/privacy", "/404"],
} satisfies Config;
