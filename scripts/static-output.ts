// Finishes the static site after `react-router build`, for Cloudflare's static assets:
// - build/client/404.html, the page served (with a 404 status) for any address with no file, as
//   plain HTML without scripts: it has only text and links, and hydrating it at an address that
//   matches a practice route (an unknown problem ID) would briefly blank the page;
// - build/client/_redirects, serving the app shell (__spa-fallback.html) at every known practice
//   address. There is no catch-all: unknown addresses, including unknown problem IDs, get the 404;
// - build/client/_headers, keeping workers.dev hosts (previews, the old address) and the app shell
//   itself out of search results;
// - build/client/robots.txt and sitemap.xml, from VITE_SITE_URL and VITE_PUBLIC_INDEXING_ENABLED.
// Run by `pnpm build`; it takes the build directory as an optional argument (default: build).

import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { loadEnv } from "vite";

import type { Problem } from "../src/domain/types.ts";
import {
  buildCanonicalUrl,
  isPublicIndexingEnabled,
  listPublicPagePaths,
  readSiteUrl,
  type SiteEnv,
} from "../src/ui/shared/publicPageMetadata.ts";

const PROBLEMS_FILE_URL = new URL("../src/data/problems.json", import.meta.url);
const DEFAULT_BUILD_DIRECTORY = "build";
/**
 * The app shell React Router writes (__spa-fallback.html) when / is a prerendered page of its own,
 * without the extension: the host would answer the .html address with a redirect, not the page.
 */
const APP_SHELL_PATH = "/__spa-fallback";
/** Both addresses of the app shell's file. */
const APP_SHELL_FILE_PATHS = `${APP_SHELL_PATH}*`;
const PROXY_STATUS = 200;
const PERMANENT_REDIRECT_STATUS = 301;
/** Cloudflare would serve 404.html at /404 with a 200; this nonexistent address gets a real 404. */
const NOT_FOUND_REDIRECT = `/404 /not-found ${PERMANENT_REDIRECT_STATUS}`;

const SCRIPT_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script>/g;
const MODULE_PRELOAD_PATTERN = /<link rel="modulepreload"[^>]*>/g;
const NOSCRIPT_PATTERN = /<noscript>([\s\S]*?)<\/noscript>/g;

/**
 * Returns the page's HTML without its scripts and script preloads; styles and links stay, and what
 * stood in for a script in <noscript> (the web fonts' stylesheet) becomes part of the page.
 */
export function removeScripts(html: string): string {
  return html
    .replaceAll(SCRIPT_PATTERN, "")
    .replaceAll(MODULE_PRELOAD_PATTERN, "")
    .replaceAll(NOSCRIPT_PATTERN, "$1");
}

/** Practice addresses that don't depend on a problem. */
const FIXED_PRACTICE_PATHS = ["/today", "/problems", "/settings"] as const;
/** Practice addresses that end in a problem ID. */
const PROBLEM_PATH_PREFIXES = ["/problems/", "/solve/", "/log/"] as const;

/** Returns every practice address the app shell should answer, one per known problem ID. */
export function listPracticePaths(problemIds: readonly string[]): string[] {
  const problemPaths = PROBLEM_PATH_PREFIXES.flatMap((prefix) =>
    problemIds.map((problemId) => `${prefix}${problemId}`),
  );
  return [...FIXED_PRACTICE_PATHS, ...problemPaths];
}

/**
 * Returns the _redirects file: each practice address is served the app shell, keeping its URL,
 * and the same address with a trailing slash redirects to it, as the old single-page host allowed.
 * /404 redirects to an address with no file, so it answers 404 like every other unknown address.
 */
export function buildRedirects(problemIds: readonly string[]): string {
  const rules: string[] = [NOT_FOUND_REDIRECT];
  for (const practicePath of listPracticePaths(problemIds)) {
    rules.push(`${practicePath} ${APP_SHELL_PATH} ${PROXY_STATUS}`);
    rules.push(`${practicePath}/ ${practicePath} ${PERMANENT_REDIRECT_STATUS}`);
  }
  return `${rules.join("\n")}\n`;
}

// Cloudflare's documented pattern for every *.workers.dev host: <version or alias>.<account>.
const WORKERS_DEV_HOSTS = "https://:version.:subdomain.workers.dev/*";
const NOINDEX_HEADER = "  X-Robots-Tag: noindex";

/**
 * Returns the _headers file: workers.dev hosts (branch previews and the old address, kept for
 * exports) and the app shell's own address are never indexed, whatever the build's flag.
 */
export function buildHeaders(): string {
  const rules = [WORKERS_DEV_HOSTS, NOINDEX_HEADER, APP_SHELL_FILE_PATHS, NOINDEX_HEADER];
  return `${rules.join("\n")}\n`;
}

/** Returns robots.txt: every crawler may read everything, and the sitemap is at the canonical origin. */
export function buildRobotsTxt(env: SiteEnv): string {
  return ["User-agent: *", "Allow: /", "", `Sitemap: ${readSiteUrl(env)}/sitemap.xml`, ""].join(
    "\n",
  );
}

/**
 * Returns sitemap.xml: the three canonical public URLs when indexing is enabled, and no entries
 * when it is not. No lastmod, since no page records when its content changed.
 */
export function buildSitemap(env: SiteEnv): string {
  const urls = isPublicIndexingEnabled(env)
    ? listPublicPagePaths().map(
        (pagePath) => `  <url><loc>${buildCanonicalUrl(env, pagePath)}</loc></url>`,
      )
    : [];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}

async function readProblemIds(): Promise<string[]> {
  const problems = JSON.parse(await readFile(PROBLEMS_FILE_URL, "utf8")) as Problem[]; // safe: problems.test.ts checks the file
  return problems.map((problem) => problem.id);
}

async function writeStaticOutput(buildDirectory: string): Promise<void> {
  const clientDirectory = path.join(buildDirectory, "client");
  // React Router prerenders /404 as a page; the host wants it as 404.html, without scripts.
  const prerenderedNotFound = path.join(clientDirectory, "404");
  const notFoundHtml = await readFile(path.join(prerenderedNotFound, "index.html"), "utf8");
  await writeFile(path.join(clientDirectory, "404.html"), removeScripts(notFoundHtml));
  await rm(prerenderedNotFound, { recursive: true });

  const redirects = buildRedirects(await readProblemIds());
  await writeFile(path.join(clientDirectory, "_redirects"), redirects);
  await writeFile(path.join(clientDirectory, "_headers"), buildHeaders());
  // The same variables the app's build read: .env files for production, then the environment.
  const env = loadEnv("production", process.cwd(), "VITE_");
  await writeFile(path.join(clientDirectory, "robots.txt"), buildRobotsTxt(env));
  await writeFile(path.join(clientDirectory, "sitemap.xml"), buildSitemap(env));
  console.error(
    `Wrote 404.html, _redirects, _headers, robots.txt and sitemap.xml in ${clientDirectory}`,
  );
}

const isRunDirectly = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isRunDirectly) {
  await writeStaticOutput(process.argv[2] ?? DEFAULT_BUILD_DIRECTORY);
}
