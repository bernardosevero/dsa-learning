import { describe, expect, it } from "vitest";

import { aMasteredMark, anAttempt, aProblem } from "@/test/builders";

import {
  countByStatus,
  filterTopics,
  groupByTopic,
  listTopicsInProgress,
  statusOf,
  type TopicGroup,
} from "../problemList";
import { deriveAllStates } from "../schedule";
import type { Entry, LocalDate, Problem } from "../types";

const TODAY: LocalDate = "2026-10-10";
const TWO_POINTERS = "Two Pointers";

const PROBLEMS: readonly Problem[] = [
  aProblem({ id: "contains-duplicate", order: 1 }),
  aProblem({ id: "valid-anagram", order: 2 }),
  aProblem({ id: "two-sum", order: 3 }),
  aProblem({ id: "valid-palindrome", order: 4, pattern: TWO_POINTERS }),
  aProblem({ id: "two-sum-ii", order: 5, pattern: TWO_POINTERS }),
];

function topicsFor(entries: readonly Entry[]): TopicGroup[] {
  const states = deriveAllStates(
    PROBLEMS.map((problem) => problem.id),
    entries,
  );
  return groupByTopic(PROBLEMS, states, TODAY);
}

function rowIdsOf(topics: readonly TopicGroup[]): string[] {
  return topics.flatMap((topic) => topic.rows.map((row) => row.problem.id));
}

describe("statusOf", () => {
  it("is new for a problem without entries", () => {
    const status = statusOf({ status: "new" }, TODAY);

    expect(status).toBe("new");
  });

  it("is scheduled for an active problem due after today", () => {
    const status = statusOf(
      { status: "active", lastRating: "medium", dueDate: "2026-10-11" },
      TODAY,
    );

    expect(status).toBe("scheduled");
  });

  it("is due for an active problem due today", () => {
    const status = statusOf({ status: "active", lastRating: "medium", dueDate: TODAY }, TODAY);

    expect(status).toBe("due");
  });

  it("is due for an active problem overdue", () => {
    const status = statusOf({ status: "active", lastRating: "hard", dueDate: "2026-10-01" }, TODAY);

    expect(status).toBe("due");
  });

  it("is mastered for a mastered problem", () => {
    const status = statusOf({ status: "mastered", since: "2026-10-01" }, TODAY);

    expect(status).toBe("mastered");
  });
});

describe("groupByTopic", () => {
  it("groups problems by pattern in NeetCode order", () => {
    const topics = topicsFor([]);

    expect(topics.map((topic) => topic.pattern)).toEqual(["Arrays & Hashing", TWO_POINTERS]);
    expect(rowIdsOf(topics)).toEqual(PROBLEMS.map((problem) => problem.id));
  });

  it("counts started or mastered, mastered and due problems per topic", () => {
    const entries = [
      anAttempt({ id: "due", problemId: "contains-duplicate", rating: "hard", date: "2026-10-01" }),
      anAttempt({ id: "scheduled", problemId: "valid-anagram", date: "2026-10-09" }),
      aMasteredMark({ problemId: "two-sum" }),
    ];

    const [arrays, twoPointers] = topicsFor(entries);

    expect(arrays).toMatchObject({ startedOrMastered: 3, mastered: 1, due: 1, total: 3 });
    expect(twoPointers).toMatchObject({ startedOrMastered: 0, mastered: 0, due: 0, total: 2 });
  });

  it("gives each row its status", () => {
    const entries = [
      anAttempt({ id: "due", problemId: "contains-duplicate", rating: "hard", date: "2026-10-01" }),
      anAttempt({ id: "scheduled", problemId: "valid-anagram", date: "2026-10-09" }),
      aMasteredMark({ problemId: "two-sum" }),
    ];

    const topics = topicsFor(entries);

    const statuses = topics.flatMap((topic) => topic.rows.map((row) => row.status));
    expect(statuses).toEqual(["due", "scheduled", "mastered", "new", "new"]);
  });

  it("marks only the first new problem in NeetCode order as up next", () => {
    const entries = [
      anAttempt({ problemId: "contains-duplicate" }),
      aMasteredMark({ problemId: "valid-anagram" }),
    ];

    const topics = topicsFor(entries);

    const upNextIds = topics.flatMap((topic) =>
      topic.rows.filter((row) => row.isUpNext).map((row) => row.problem.id),
    );
    expect(upNextIds).toEqual(["two-sum"]);
  });
});

describe("listTopicsInProgress", () => {
  it("leaves out a topic with nothing started that isn't the next new problem's topic", () => {
    const entries = [anAttempt({ problemId: "contains-duplicate" })];

    const topics = listTopicsInProgress(topicsFor(entries));

    expect(topics.map((topic) => topic.pattern)).toEqual(["Arrays & Hashing"]);
  });

  it("keeps topics in NeetCode order once any of their problems isn't new", () => {
    const entries = [
      anAttempt({ id: "later-topic", problemId: "two-sum-ii" }),
      anAttempt({ id: "earlier-topic", problemId: "contains-duplicate" }),
    ];

    const topics = listTopicsInProgress(topicsFor(entries));

    expect(topics.map((topic) => topic.pattern)).toEqual(["Arrays & Hashing", TWO_POINTERS]);
  });

  it("includes the next new problem's topic even with nothing started in it", () => {
    const entries = [
      anAttempt({ id: "first", problemId: "contains-duplicate" }),
      anAttempt({ id: "second", problemId: "valid-anagram" }),
      anAttempt({ id: "third", problemId: "two-sum" }),
    ];

    const [, twoPointers] = listTopicsInProgress(topicsFor(entries));

    expect(twoPointers).toMatchObject({ pattern: TWO_POINTERS, startedOrMastered: 0, total: 2 });
  });

  it("counts a mastered problem as started and as mastered", () => {
    const entries = [aMasteredMark({ problemId: "contains-duplicate" })];

    const [arrays] = listTopicsInProgress(topicsFor(entries));

    expect(arrays).toMatchObject({ startedOrMastered: 1, mastered: 1, total: 3 });
  });
});

describe("filterTopics", () => {
  it("keeps every topic and row for all", () => {
    const topics = topicsFor([]);

    const filtered = filterTopics(topics, "all");

    expect(filtered).toEqual(topics);
  });

  it("keeps only due rows and drops topics without any", () => {
    const entries = [
      anAttempt({ id: "due", problemId: "valid-anagram", rating: "hard", date: "2026-10-01" }),
      anAttempt({ id: "scheduled", problemId: "valid-palindrome", date: "2026-10-09" }),
    ];

    const filtered = filterTopics(topicsFor(entries), "due");

    expect(filtered.map((topic) => topic.pattern)).toEqual(["Arrays & Hashing"]);
    expect(rowIdsOf(filtered)).toEqual(["valid-anagram"]);
  });

  it("keeps the topic counts of the whole topic when rows are filtered", () => {
    const entries = [aMasteredMark({ problemId: "two-sum" })];

    const [arrays] = filterTopics(topicsFor(entries), "mastered");

    expect(arrays).toMatchObject({ mastered: 1, total: 3 });
    expect(arrays?.rows).toHaveLength(1);
  });
});

describe("countByStatus", () => {
  it("counts every status across all topics", () => {
    const entries = [
      anAttempt({ id: "due", problemId: "contains-duplicate", rating: "hard", date: "2026-10-01" }),
      anAttempt({ id: "scheduled", problemId: "valid-anagram", date: "2026-10-09" }),
      aMasteredMark({ problemId: "two-sum" }),
    ];

    const counts = countByStatus(topicsFor(entries));

    expect(counts).toEqual({ new: 2, scheduled: 1, due: 1, mastered: 1 });
  });
});
