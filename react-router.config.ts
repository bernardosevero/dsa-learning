import process from "node:process";

import type { Config } from "@react-router/dev/config";

// Static hosting: no server at runtime. Public pages are prerendered at build time; every other
// path gets the client-rendered app shell (build/client/index.html).
export default {
  appDirectory: "src",
  // The sync end-to-end tests build into their own folder, so they never mix with `pnpm build`.
  buildDirectory: process.env.BUILD_DIRECTORY ?? "build",
  ssr: false,
  // /404 is rendered only to become build/client/404.html (see scripts/static-output.ts).
  prerender: ["/privacy", "/404"],
} satisfies Config;
