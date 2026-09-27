// Builds src/data/problems.json from neetcode-gh/leetcode's MIT-licensed problem metadata and
// the NeetCode slug snapshot in scripts/data/nc-links.json.
// Run with `pnpm tsx scripts/build-problems.ts`. Summaries already in problems.json are kept,
// so re-running never erases them.

import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";

import type { Difficulty, Problem } from "../src/domain/types.ts";

const SOURCE_URL =
  "https://raw.githubusercontent.com/neetcode-gh/leetcode/main/.problemSiteData.json";
const NEETCODE_SLUGS_FILE_URL = new URL("data/nc-links.json", import.meta.url);
const PROBLEMS_FILE_URL = new URL("../src/data/problems.json", import.meta.url);

// The source's `link` is a LeetCode slug with a trailing slash, e.g. "contains-duplicate/".
const SOURCE_LINK_PATTERN = /^[a-z0-9-]+\/$/;
const DIFFICULTIES: readonly Difficulty[] = ["Easy", "Medium", "Hard"];

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

interface SourceRecord {
  problem: string;
  pattern: string;
  link: string;
  difficulty: Difficulty;
  video?: string;
  blind75?: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDifficulty(value: unknown): value is Difficulty {
  return DIFFICULTIES.some((difficulty) => difficulty === value);
}

function hasRequiredSourceFields(value: Record<string, unknown>): boolean {
  const { problem, pattern, link, difficulty } = value;
  if (typeof problem !== "string" || typeof pattern !== "string") {
    return false;
  }
  return typeof link === "string" && SOURCE_LINK_PATTERN.test(link) && isDifficulty(difficulty);
}

function hasValidOptionalSourceFields(value: Record<string, unknown>): boolean {
  const { video, blind75 } = value;
  const hasValidVideo = video === undefined || typeof video === "string";
  return hasValidVideo && (blind75 === undefined || typeof blind75 === "boolean");
}

function isSourceRecord(value: unknown): value is SourceRecord {
  if (!isPlainObject(value)) {
    return false;
  }
  return hasRequiredSourceFields(value) && hasValidOptionalSourceFields(value);
}

function leetcodeSlugOf(record: SourceRecord): string {
  return record.link.slice(0, -1);
}

function isInNeetcode150(value: unknown): boolean {
  return isPlainObject(value) && value.neetcode150 === true;
}

function parseJson(text: string, sourceName: string): Result<unknown> {
  try {
    const parsed: unknown = JSON.parse(text);
    return { ok: true, value: parsed };
  } catch (error) {
    return { ok: false, error: `${sourceName} is not valid JSON: ${String(error)}` };
  }
}

async function fetchJson(url: string): Promise<Result<unknown>> {
  const response = await fetch(url);
  if (!response.ok) {
    return { ok: false, error: `GET ${url} failed with HTTP ${response.status}` };
  }
  return parseJson(await response.text(), url);
}

/** Returns the neetcode150 records in file order, or the first record with an unexpected shape. */
function parseNeetcode150(source: unknown): Result<SourceRecord[]> {
  if (!Array.isArray(source)) {
    return { ok: false, error: "The problem site data is not an array" };
  }
  const records: SourceRecord[] = [];
  for (const candidate of source.filter(isInNeetcode150)) {
    if (!isSourceRecord(candidate)) {
      return { ok: false, error: `Unexpected record shape: ${JSON.stringify(candidate)}` };
    }
    records.push(candidate);
  }
  return { ok: true, value: records };
}

async function readNeetcodeSlugs(): Promise<Result<Map<string, string>>> {
  const parsed = parseJson(await readFile(NEETCODE_SLUGS_FILE_URL, "utf8"), "nc-links.json");
  if (!parsed.ok) {
    return parsed;
  }
  if (!isPlainObject(parsed.value)) {
    return { ok: false, error: "nc-links.json is not an object" };
  }
  const neetcodeSlugs = new Map<string, string>();
  for (const [leetcodeSlug, neetcodeSlug] of Object.entries(parsed.value)) {
    if (typeof neetcodeSlug !== "string") {
      return { ok: false, error: `nc-links.json has a non-string slug for "${leetcodeSlug}"` };
    }
    neetcodeSlugs.set(leetcodeSlug, neetcodeSlug);
  }
  return { ok: true, value: neetcodeSlugs };
}

function hasIdAndSummary(value: unknown): value is Pick<Problem, "id" | "summary"> {
  return isPlainObject(value) && typeof value.id === "string" && typeof value.summary === "string";
}

/** Returns the summaries already written in problems.json, keyed by problem id. */
async function readExistingSummaries(): Promise<Result<Map<string, string>>> {
  const summaries = new Map<string, string>();
  if (!existsSync(PROBLEMS_FILE_URL)) {
    return { ok: true, value: summaries };
  }
  const parsed = parseJson(await readFile(PROBLEMS_FILE_URL, "utf8"), "problems.json");
  if (!parsed.ok) {
    return parsed;
  }
  if (!Array.isArray(parsed.value) || !parsed.value.every(hasIdAndSummary)) {
    return { ok: false, error: "problems.json is not a list of problems with id and summary" };
  }
  for (const problem of parsed.value) {
    summaries.set(problem.id, problem.summary);
  }
  return { ok: true, value: summaries };
}

interface ProblemInputs {
  record: SourceRecord;
  order: number;
  neetcodeSlug: string;
  summary: string;
}

function toProblem({ record, order, neetcodeSlug, summary }: ProblemInputs): Problem {
  const id = leetcodeSlugOf(record);
  const hasVideo = record.video !== undefined && record.video !== "";
  return {
    id,
    title: record.problem,
    summary,
    pattern: record.pattern,
    difficulty: record.difficulty,
    neetcodeUrl: `https://neetcode.io/problems/${neetcodeSlug}`,
    leetcodeUrl: `https://leetcode.com/problems/${id}/`,
    order,
    ...(hasVideo ? { videoId: record.video } : {}),
    ...(record.blind75 === undefined ? {} : { blind75: record.blind75 }),
  };
}

/** Maps records to problems ordered 1..n, or lists every id missing from the slug snapshot. */
function toProblems(
  records: readonly SourceRecord[],
  neetcodeSlugs: ReadonlyMap<string, string>,
  summaries: ReadonlyMap<string, string>,
): Result<Problem[]> {
  const problems: Problem[] = [];
  const idsWithoutSlug: string[] = [];
  for (const [index, record] of records.entries()) {
    const id = leetcodeSlugOf(record);
    const neetcodeSlug = neetcodeSlugs.get(id);
    if (neetcodeSlug === undefined) {
      idsWithoutSlug.push(id);
      continue;
    }
    const summary = summaries.get(id) ?? "";
    problems.push(toProblem({ record, order: index + 1, neetcodeSlug, summary }));
  }
  if (idsWithoutSlug.length > 0) {
    const missing = idsWithoutSlug.join(", ");
    return { ok: false, error: `No NeetCode slug in nc-links.json for: ${missing}` };
  }
  return { ok: true, value: problems };
}

interface BuildInputs {
  records: SourceRecord[];
  neetcodeSlugs: Map<string, string>;
  summaries: Map<string, string>;
}

async function loadInputs(): Promise<Result<BuildInputs>> {
  const source = await fetchJson(SOURCE_URL);
  if (!source.ok) {
    return source;
  }
  const records = parseNeetcode150(source.value);
  if (!records.ok) {
    return records;
  }
  const neetcodeSlugs = await readNeetcodeSlugs();
  if (!neetcodeSlugs.ok) {
    return neetcodeSlugs;
  }
  const summaries = await readExistingSummaries();
  if (!summaries.ok) {
    return summaries;
  }
  return {
    ok: true,
    value: {
      records: records.value,
      neetcodeSlugs: neetcodeSlugs.value,
      summaries: summaries.value,
    },
  };
}

async function buildProblems(): Promise<Result<number>> {
  const inputs = await loadInputs();
  if (!inputs.ok) {
    return inputs;
  }
  const { records, neetcodeSlugs, summaries } = inputs.value;
  const problems = toProblems(records, neetcodeSlugs, summaries);
  if (!problems.ok) {
    return problems;
  }
  const problemsJson = `${JSON.stringify(problems.value, undefined, 2)}\n`;
  await writeFile(PROBLEMS_FILE_URL, problemsJson);
  return { ok: true, value: problems.value.length };
}

const build = await buildProblems();
if (build.ok) {
  process.stdout.write(`Wrote ${build.value} problems to src/data/problems.json\n`);
} else {
  console.error(`build-problems failed: ${build.error}`);
  process.exitCode = 1;
}
