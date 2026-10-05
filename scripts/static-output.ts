// Finishes the static site after `react-router build`, for Cloudflare's static assets:
// - build/client/404.html, the page served (with a 404 status) for any address with no file, as
//   plain HTML without scripts: it has only text and links, and hydrating it at an address that
//   matches a practice route (an unknown problem ID) would briefly blank the page;
// - build/client/_redirects, serving the app shell (index.html) at every known practice address.
// Unknown addresses, including unknown problem IDs, fall through to the 404 page.
// Run by `pnpm build`; it takes the build directory as an optional argument (default: build).

import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import type { Problem } from "../src/domain/types.ts";

const PROBLEMS_FILE_URL = new URL("../src/data/problems.json", import.meta.url);
const DEFAULT_BUILD_DIRECTORY = "build";
/** The app shell React Router writes for every address it didn't prerender. */
const APP_SHELL_PATH = "/";
const PROXY_STATUS = 200;
const PERMANENT_REDIRECT_STATUS = 301;
/** Cloudflare would serve 404.html at /404 with a 200; this nonexistent address gets a real 404. */
const NOT_FOUND_REDIRECT = `/404 /not-found ${PERMANENT_REDIRECT_STATUS}`;

const SCRIPT_PATTERN = /<script\b[^>]*>[\s\S]*?<\/script>/g;
const MODULE_PRELOAD_PATTERN = /<link rel="modulepreload"[^>]*>/g;

/** Returns the page's HTML without its scripts and script preloads; styles and links stay. */
export function removeScripts(html: string): string {
  return html.replaceAll(SCRIPT_PATTERN, "").replaceAll(MODULE_PRELOAD_PATTERN, "");
}

/** Practice addresses that don't depend on a problem. "/" is the app shell itself. */
const FIXED_PRACTICE_PATHS = ["/problems", "/settings"] as const;
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
  console.error(`Wrote 404.html and _redirects in ${clientDirectory}`);
}

const isRunDirectly = import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isRunDirectly) {
  await writeStaticOutput(process.argv[2] ?? DEFAULT_BUILD_DIRECTORY);
}
