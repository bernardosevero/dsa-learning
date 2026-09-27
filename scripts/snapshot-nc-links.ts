// Snapshots NeetCode's practice slugs (ncLink) from neetcode.io's JS bundle into
// scripts/data/nc-links.json, keyed by LeetCode slug. Run once with
// `pnpm tsx scripts/snapshot-nc-links.ts`; the app never fetches the bundle at runtime.

import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const NEETCODE_HOME_URL = "https://neetcode.io/";
const OUTPUT_FILE_URL = new URL("data/nc-links.json", import.meta.url);

// The bundle is emitted as e.g. <script src="main.f39af0c52a4e9fb5.js" type="module">.
const MAIN_BUNDLE_SCRIPT_PATTERN = /<script[^>]*\ssrc="([^"]*main\.[a-z0-9]+\.js)"/;
// Each problem is a flat object literal:
// {problem:"Contains Duplicate",...,link:"contains-duplicate/",...,ncLink:"duplicate-integer/"}
const PROBLEM_RECORD_PATTERN = /\{problem:"[^{}]*\}/g;
const LEETCODE_SLUG_PATTERN = /[{,]link:"([a-z0-9-]+)\/"/;
const NEETCODE_SLUG_PATTERN = /[{,]ncLink:"([a-z0-9-]+)\/"/;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

async function fetchText(url: string): Promise<Result<string>> {
  const response = await fetch(url);
  if (!response.ok) {
    return { ok: false, error: `GET ${url} failed with HTTP ${response.status}` };
  }
  return { ok: true, value: await response.text() };
}

function findMainBundleUrl(homeHtml: string): Result<string> {
  const match = MAIN_BUNDLE_SCRIPT_PATTERN.exec(homeHtml);
  if (match?.[1] === undefined) {
    return { ok: false, error: `No main.*.js <script src> found in ${NEETCODE_HOME_URL}` };
  }
  return { ok: true, value: new URL(match[1], NEETCODE_HOME_URL).href };
}

/** Returns [leetcodeSlug, neetcodeSlug] when the record has both, otherwise undefined. */
function readSlugPair(record: string): [string, string] | undefined {
  const leetcodeSlug = LEETCODE_SLUG_PATTERN.exec(record)?.[1];
  const neetcodeSlug = NEETCODE_SLUG_PATTERN.exec(record)?.[1];
  if (leetcodeSlug === undefined || neetcodeSlug === undefined) {
    return undefined;
  }
  return [leetcodeSlug, neetcodeSlug];
}

/** Returns { leetcodeSlug: neetcodeSlug } for records that have both, or the first conflict. */
function extractNeetcodeSlugs(bundle: string): Result<Map<string, string>> {
  const neetcodeSlugByLeetcodeSlug = new Map<string, string>();
  for (const [record] of bundle.matchAll(PROBLEM_RECORD_PATTERN)) {
    const slugPair = readSlugPair(record);
    if (slugPair === undefined) {
      continue;
    }
    const [leetcodeSlug, neetcodeSlug] = slugPair;
    const knownSlug = neetcodeSlugByLeetcodeSlug.get(leetcodeSlug);
    if (knownSlug !== undefined && knownSlug !== neetcodeSlug) {
      const error = `"${leetcodeSlug}" maps to both "${knownSlug}" and "${neetcodeSlug}"`;
      return { ok: false, error };
    }
    neetcodeSlugByLeetcodeSlug.set(leetcodeSlug, neetcodeSlug);
  }
  if (neetcodeSlugByLeetcodeSlug.size === 0) {
    return { ok: false, error: "No link/ncLink pairs found in the bundle" };
  }
  return { ok: true, value: neetcodeSlugByLeetcodeSlug };
}

// Code-point order, so the file is identical on every machine and locale.
function compareByKey(a: readonly [string, string], b: readonly [string, string]): number {
  if (a[0] === b[0]) {
    return 0;
  }
  return a[0] < b[0] ? -1 : 1;
}

function toSortedJson(neetcodeSlugByLeetcodeSlug: ReadonlyMap<string, string>): string {
  const sortedEntries = [...neetcodeSlugByLeetcodeSlug].toSorted(compareByKey);
  return `${JSON.stringify(Object.fromEntries(sortedEntries), undefined, 2)}\n`;
}

async function snapshotNeetcodeSlugs(): Promise<Result<number>> {
  const homeHtml = await fetchText(NEETCODE_HOME_URL);
  if (!homeHtml.ok) {
    return homeHtml;
  }
  const bundleUrl = findMainBundleUrl(homeHtml.value);
  if (!bundleUrl.ok) {
    return bundleUrl;
  }
  const bundle = await fetchText(bundleUrl.value);
  if (!bundle.ok) {
    return bundle;
  }
  const slugs = extractNeetcodeSlugs(bundle.value);
  if (!slugs.ok) {
    return slugs;
  }
  await mkdir(new URL(".", OUTPUT_FILE_URL), { recursive: true });
  await writeFile(OUTPUT_FILE_URL, toSortedJson(slugs.value));
  process.stdout.write(`Read ${bundleUrl.value}\n`);
  return { ok: true, value: slugs.value.size };
}

const snapshot = await snapshotNeetcodeSlugs();
if (snapshot.ok) {
  process.stdout.write(`Wrote ${snapshot.value} slugs to scripts/data/nc-links.json\n`);
} else {
  console.error(`snapshot-nc-links failed: ${snapshot.error}`);
  process.exitCode = 1;
}
