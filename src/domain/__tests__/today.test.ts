import { describe, expect, it } from "vitest";

import { aMasteredMark, anAttempt, aProblem } from "@/test/builders";

import { deriveAllStates } from "../schedule";
import { buildToday, countStatuses, type TodayView } from "../today";
import {
  DEFAULT_SETTINGS,
  type Entry,
  type LocalDate,
  type MarkedMastered,
  type Problem,
  type ProblemState,
} from "../types";

const TODAY: LocalDate = "2026-10-10";
const ARRAYS = "Arrays & Hashing";
const TWO_POINTERS = "Two Pointers";

const PROBLEMS: readonly Problem[] = [
  aProblem({ id: "contains-duplicate", order: 1 }),
  aProblem({ id: "valid-anagram", order: 2 }),
  aProblem({ id: "two-sum", order: 3 }),
  aProblem({ id: "valid-palindrome", order: 4, pattern: TWO_POINTERS }),
  aProblem({ id: "two-sum-ii", order: 5, pattern: TWO_POINTERS, difficulty: "Medium" }),
  aProblem({ id: "three-sum", order: 6, pattern: TWO_POINTERS, difficulty: "Medium" }),
];

function statesFor(entries: readonly Entry[]): Record<string, ProblemState> {
  return deriveAllStates(
    PROBLEMS.map((problem) => problem.id),
    entries,
  );
}

type ListView = Extract<TodayView, { kind: "list" }>;

function buildTodayFor(entries: readonly Entry[]): TodayView {
  return buildToday({
    problems: PROBLEMS,
    states: statesFor(entries),
    entries,
    settings: DEFAULT_SETTINGS,
    today: TODAY,
  });
}

function expectList(view: TodayView): ListView {
  if (view.kind !== "list") {
    throw new Error(`Expected a list view, got ${view.kind}.`);
  }
  return view;
}

function reviewedIds(view: TodayView): string[] {
  return expectList(view).reviews.map((review) => review.problem.id);
}

function masterAllExcept(keptIds: readonly string[]): MarkedMastered[] {
  return PROBLEMS.filter((problem) => !keptIds.includes(problem.id)).map((problem) =>
    aMasteredMark({ problemId: problem.id }),
  );
}

describe("buildToday", () => {
  it("returns a due review and the next new problem together", () => {
    const entries = [anAttempt({ rating: "hard", date: "2026-10-08" })];

    const view = expectList(buildTodayFor(entries));

    expect(view.reviews).toHaveLength(1);
    expect(view.reviews[0]?.problem.id).toBe("contains-duplicate");
    expect(view.nextNew?.id).toBe("valid-anagram");
  });

  it("offers the lowest-order new problem and skips one marked mastered without attempts", () => {
    const entries = [
      anAttempt({ rating: "easy", date: "2026-10-08" }),
      aMasteredMark({ problemId: "valid-anagram" }),
    ];

    const view = expectList(buildTodayFor(entries));

    expect(view.nextNew?.id).toBe("two-sum");
  });

  it("puts a Hard due 2 days ago before a Medium due 3 days ago", () => {
    const entries = [
      anAttempt({ problemId: "contains-duplicate", rating: "medium", date: "2026-09-30" }),
      anAttempt({ problemId: "two-sum", rating: "hard", date: "2026-10-06" }),
    ];

    const view = expectList(buildTodayFor(entries));

    expect(view.reviews.map((review) => review.problem.id)).toEqual([
      "two-sum",
      "contains-duplicate",
    ]);
    expect(view.reviews[0]).toMatchObject({
      dueDate: "2026-10-08",
      daysOverdue: 2,
      lastRating: "hard",
      risk: 1,
    });
    expect(view.reviews[1]?.daysOverdue).toBe(3);
    expect(view.reviews[1]?.risk).toBeCloseTo(3 / 7);
  });

  it("breaks equal risk ties by Hard before Medium, then by NeetCode order", () => {
    const entries = [
      anAttempt({ problemId: "contains-duplicate", rating: "medium", date: "2026-09-26" }),
      anAttempt({ problemId: "three-sum", rating: "hard", date: "2026-10-06" }),
      anAttempt({ problemId: "valid-palindrome", rating: "hard", date: "2026-10-06" }),
    ];

    const view = buildTodayFor(entries);

    expect(reviewedIds(view)).toEqual(["valid-palindrome", "three-sum", "contains-duplicate"]);
  });

  it("leaves problems due in the future and mastered problems out of the reviews", () => {
    const entries = [
      anAttempt({ problemId: "contains-duplicate", rating: "easy", date: "2026-10-05" }),
      aMasteredMark({ problemId: "valid-anagram" }),
      anAttempt({ problemId: "two-sum", rating: "hard", date: "2026-10-08" }),
    ];

    const view = buildTodayFor(entries);

    expect(reviewedIds(view)).toEqual(["two-sum"]);
  });

  it("is caught up with the earliest due date when nothing is due and nothing is new", () => {
    const entries = [
      ...masterAllExcept(["two-sum-ii", "three-sum"]),
      anAttempt({ problemId: "two-sum-ii", rating: "medium", date: "2026-10-08" }),
      anAttempt({ problemId: "three-sum", rating: "easy", date: "2026-10-05" }),
    ];

    const view = buildTodayFor(entries);

    expect(view).toEqual({ kind: "caught-up", nextDue: "2026-10-15" });
  });

  it("is caught up with no next due date when everything is mastered", () => {
    const entries = masterAllExcept([]);

    const view = buildTodayFor(entries);

    expect(view).toEqual({ kind: "caught-up", nextDue: null });
  });

  it("estimates from each review's last attempt time and falls back to the time box", () => {
    const entries = [
      anAttempt({ problemId: "contains-duplicate", date: "2026-09-20", timeMinutes: 40 }),
      anAttempt({ problemId: "contains-duplicate", date: "2026-10-01", timeMinutes: 25 }),
    ];
    const states: Record<string, ProblemState> = {
      ...statesFor(entries),
      "two-sum-ii": { status: "active", lastRating: "hard", dueDate: "2026-10-09" },
    };

    const view = buildToday({
      problems: PROBLEMS,
      states,
      entries,
      settings: DEFAULT_SETTINGS,
      today: TODAY,
    });

    expect(expectList(view).estimateMinutes).toBe(25 + DEFAULT_SETTINGS.timeBoxMinutes.Medium);
  });

  it("counts progress in the next new problem's pattern", () => {
    const entries = [
      anAttempt({ problemId: "contains-duplicate", date: "2026-10-08" }),
      aMasteredMark({ problemId: "valid-anagram" }),
      anAttempt({ problemId: "valid-palindrome", date: "2026-10-08" }),
    ];

    const view = expectList(buildTodayFor(entries));

    expect(view.nextNew?.id).toBe("two-sum");
    expect(view.newTopic).toEqual({ pattern: ARRAYS, done: 2, total: 3 });
  });

  it("has no new topic when no problem is new", () => {
    const entries = [
      ...masterAllExcept(["contains-duplicate"]),
      anAttempt({ problemId: "contains-duplicate", rating: "hard", date: "2026-10-08" }),
    ];

    const view = expectList(buildTodayFor(entries));

    expect(view.nextNew).toBeNull();
    expect(view.newTopic).toBeNull();
  });
});

describe("countStatuses", () => {
  it("counts due reviews, new problems left, and mastered problems", () => {
    const states: Record<string, ProblemState> = {
      "contains-duplicate": { status: "active", lastRating: "medium", dueDate: "2026-10-03" },
      "valid-anagram": { status: "mastered", since: "2026-10-01" },
      "two-sum": { status: "active", lastRating: "hard", dueDate: TODAY },
      "valid-palindrome": { status: "active", lastRating: "easy", dueDate: "2026-11-04" },
      "two-sum-ii": { status: "new" },
      "three-sum": { status: "new" },
    };

    const counts = countStatuses(PROBLEMS, states, TODAY);

    expect(counts).toEqual({ due: 2, newLeft: 2, mastered: 1 });
  });
});
