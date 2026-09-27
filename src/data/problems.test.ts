import { describe, expect, it } from "vitest";

import type { Difficulty, Problem } from "@/domain/types";

import { PROBLEMS } from "./problems";

const PROBLEM_COUNT = 150;
const PATTERN_COUNT = 18;
const NEETCODE_URL_PATTERN = /^https:\/\/neetcode\.io\/problems\/[a-z0-9-]+$/;
const LEETCODE_URL_PATTERN = /^https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/$/;
const MAX_SUMMARY_LENGTH = 120;
// Words that would give away the solution technique on a review, where the pattern is hidden.
const BANNED_TECHNIQUE_WORDS = [
  "hash",
  "hashmap",
  "hash map",
  "hashset",
  "hash set",
  "two pointers",
  "sliding window",
  "binary search",
  "heap",
  "priority queue",
  "queue",
  "stack",
  "trie",
  "dfs",
  "bfs",
  "depth-first",
  "breadth-first",
  "dynamic programming",
  "memoization",
  "greedy",
  "backtracking",
  "recursion",
  "union-find",
  "union find",
  "disjoint set",
  "bit manipulation",
  "bitmask",
  "xor",
  "prefix sum",
  "topological",
  "dijkstra",
  "monotonic",
] as const;

function compareByOrder(a: Problem, b: Problem): number {
  return a.order - b.order;
}

function countByDifficulty(problems: readonly Problem[]): Record<Difficulty, number> {
  const counts: Record<Difficulty, number> = { Easy: 0, Medium: 0, Hard: 0 };
  for (const problem of problems) {
    counts[problem.difficulty] += 1;
  }
  return counts;
}

/** Returns each pattern once per contiguous run, in order. */
function patternRuns(problems: readonly Problem[]): string[] {
  const runs: string[] = [];
  for (const problem of problems.toSorted(compareByOrder)) {
    if (runs.at(-1) !== problem.pattern) {
      runs.push(problem.pattern);
    }
  }
  return runs;
}

function containsWord(text: string, word: string): boolean {
  return new RegExp(`\\b${word}\\b`, "i").test(text);
}

/** Returns the banned words in the problem's summary that its title doesn't contain. */
function bannedWordsIn(problem: Pick<Problem, "title" | "summary">): string[] {
  return BANNED_TECHNIQUE_WORDS.filter(
    (word) => containsWord(problem.summary, word) && !containsWord(problem.title, word),
  );
}

function neetcodeUrlOf(id: string): string | undefined {
  return PROBLEMS.find((problem) => problem.id === id)?.neetcodeUrl;
}

describe("PROBLEMS", () => {
  it("has exactly 150 problems with unique ids", () => {
    const ids = new Set(PROBLEMS.map((problem) => problem.id));

    expect(PROBLEMS).toHaveLength(PROBLEM_COUNT);
    expect(ids.size).toBe(PROBLEM_COUNT);
  });

  it("numbers the problems 1..150 in list order", () => {
    const expectedOrders = Array.from({ length: PROBLEM_COUNT }, (_element, index) => index + 1);

    const orders = PROBLEMS.map((problem) => problem.order);

    expect(orders).toEqual(expectedOrders);
  });

  it("has 18 patterns, each one's problems contiguous in order", () => {
    const distinctPatterns = new Set(PROBLEMS.map((problem) => problem.pattern));

    const runs = patternRuns(PROBLEMS);

    expect(distinctPatterns.size).toBe(PATTERN_COUNT);
    expect(runs).toHaveLength(PATTERN_COUNT);
  });

  it("has 28 Easy, 101 Medium and 21 Hard problems", () => {
    const counts = countByDifficulty(PROBLEMS);

    expect(counts).toEqual({ Easy: 28, Medium: 101, Hard: 21 });
  });

  it("links every problem to a NeetCode practice page and a LeetCode page", () => {
    const neetcodeUrls = PROBLEMS.map((problem) => problem.neetcodeUrl);
    const leetcodeUrls = PROBLEMS.map((problem) => problem.leetcodeUrl);

    for (const url of neetcodeUrls) {
      expect(url).toMatch(NEETCODE_URL_PATTERN);
    }
    for (const url of leetcodeUrls) {
      expect(url).toMatch(LEETCODE_URL_PATTERN);
    }
  });

  it.each(PROBLEMS.map((problem) => [problem.id, problem] as const))(
    "gives %s a one-line summary of at most 120 characters ending with a period",
    (_id, problem) => {
      const { summary } = problem;

      expect(summary.trim()).not.toBe("");
      expect(summary.length).toBeLessThanOrEqual(MAX_SUMMARY_LENGTH);
      expect(summary.endsWith(".")).toBe(true);
    },
  );

  it.each(PROBLEMS.map((problem) => [problem.id, problem] as const))(
    "keeps the summary of %s free of technique words its title doesn't use",
    (_id, problem) => {
      const bannedWords = bannedWordsIn(problem);

      expect(bannedWords).toEqual([]);
    },
  );

  it("flags a technique word in a summary unless the title contains it", () => {
    const summaryNamingStack = { title: "Some Problem", summary: "Push it on a Stack." };
    const titleNamingStack = { title: "Min Stack", summary: "Push it on a Stack." };

    const bannedInSummary = bannedWordsIn(summaryNamingStack);
    const bannedWithTitle = bannedWordsIn(titleNamingStack);

    expect(bannedInSummary).toEqual(["stack"]);
    expect(bannedWithTitle).toEqual([]);
  });

  it.each([
    ["contains-duplicate", "duplicate-integer"],
    ["valid-anagram", "is-anagram"],
    ["meeting-rooms", "meeting-schedule"],
    ["meeting-rooms-ii", "meeting-schedule-ii"],
    ["alien-dictionary", "foreign-dictionary"],
    ["graph-valid-tree", "valid-tree"],
    ["walls-and-gates", "islands-and-treasure"],
    ["encode-and-decode-strings", "string-encode-and-decode"],
    ["number-of-connected-components-in-an-undirected-graph", "count-connected-components"],
  ])("maps LeetCode's %s to NeetCode's %s", (leetcodeSlug, neetcodeSlug) => {
    const neetcodeUrl = neetcodeUrlOf(leetcodeSlug);

    expect(neetcodeUrl).toBe(`https://neetcode.io/problems/${neetcodeSlug}`);
  });
});
