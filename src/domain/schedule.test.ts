import { describe, expect, it } from "vitest";

import { deriveAllStates, deriveState, earliestDueDate, lastAttempt } from "./schedule";
import type { Attempt, MarkedMastered, ProblemState } from "./types";

const DEFAULT_TIME_MINUTES = 20;

function anAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    type: "attempt",
    id: "attempt-1",
    problemId: "contains-duplicate",
    completedAt: `${overrides.date ?? "2026-10-01"}T12:00:00.000Z`,
    date: "2026-10-01",
    rating: "medium",
    timeMinutes: DEFAULT_TIME_MINUTES,
    help: "none",
    ...overrides,
  };
}

function aMasteredMark(overrides: Partial<MarkedMastered> = {}): MarkedMastered {
  return {
    type: "markedMastered",
    id: "mark-1",
    problemId: "contains-duplicate",
    at: `${overrides.date ?? "2026-10-01"}T13:00:00.000Z`,
    date: "2026-10-01",
    ...overrides,
  };
}

describe("deriveState", () => {
  it("returns new when the problem has no entries", () => {
    const state = deriveState([]);

    expect(state).toEqual({ status: "new" });
  });

  it("schedules Hard, Medium, and Easy at their fixed intervals", () => {
    const hardState = deriveState([anAttempt({ rating: "hard" })]);
    const mediumState = deriveState([anAttempt({ rating: "medium" })]);
    const easyState = deriveState([anAttempt({ rating: "easy" })]);

    expect(hardState).toEqual({ status: "active", lastRating: "hard", dueDate: "2026-10-03" });
    expect(mediumState).toEqual({
      status: "active",
      lastRating: "medium",
      dueDate: "2026-10-08",
    });
    expect(easyState).toEqual({ status: "active", lastRating: "easy", dueDate: "2026-10-31" });
  });

  it("masters a problem after Easy on its due review", () => {
    const firstEasy = anAttempt({ rating: "easy" });
    const dueEasy = anAttempt({ id: "attempt-2", date: "2026-10-31", rating: "easy" });

    const state = deriveState([firstEasy, dueEasy]);

    expect(state).toEqual({ status: "mastered", since: "2026-10-31" });
  });

  it("masters a problem after Easy on a late review", () => {
    const firstEasy = anAttempt({ rating: "easy" });
    const lateEasy = anAttempt({ id: "attempt-2", date: "2026-11-05", rating: "easy" });

    const state = deriveState([firstEasy, lateEasy]);

    expect(state).toEqual({ status: "mastered", since: "2026-11-05" });
  });

  it("reschedules early Easy practice without mastering the problem", () => {
    const firstEasy = anAttempt({ rating: "easy" });
    const earlyEasy = anAttempt({ id: "attempt-2", date: "2026-10-11", rating: "easy" });

    const state = deriveState([firstEasy, earlyEasy]);

    expect(state).toEqual({ status: "active", lastRating: "easy", dueDate: "2026-11-10" });
  });

  it("returns a mastered problem to rotation after Medium", () => {
    const masteredMark = aMasteredMark();
    const mediumAttempt = anAttempt({ id: "attempt-2", date: "2026-12-01", rating: "medium" });

    const state = deriveState([masteredMark, mediumAttempt]);

    expect(state).toEqual({
      status: "active",
      lastRating: "medium",
      dueDate: "2026-12-08",
    });
  });

  it("keeps a mastered problem mastered after another Easy", () => {
    const masteredMark = aMasteredMark();
    const easyAttempt = anAttempt({ id: "attempt-2", date: "2026-12-01", rating: "easy" });

    const state = deriveState([masteredMark, easyAttempt]);

    expect(state).toEqual({ status: "mastered", since: "2026-10-01" });
  });

  it("keeps the Medium interval fixed after repeated Medium attempts", () => {
    const first = anAttempt();
    const second = anAttempt({ id: "attempt-2", date: "2026-10-08" });
    const third = anAttempt({ id: "attempt-3", date: "2026-10-15" });

    const state = deriveState([first, second, third]);

    expect(state).toEqual({
      status: "active",
      lastRating: "medium",
      dueDate: "2026-10-22",
    });
  });

  it("uses the last timestamp for multiple attempts on one day", () => {
    const hardAttempt = anAttempt({
      id: "attempt-1",
      rating: "hard",
      completedAt: "2026-10-01T09:00:00.000Z",
    });
    const easyAttempt = anAttempt({
      id: "attempt-2",
      rating: "easy",
      completedAt: "2026-10-01T17:00:00.000Z",
    });

    const state = deriveState([easyAttempt, hardAttempt]);

    expect(state).toEqual({ status: "active", lastRating: "easy", dueDate: "2026-10-31" });
  });

  it("manually masters a new or active problem", () => {
    const activeAttempt = anAttempt({ rating: "hard" });
    const masteredMark = aMasteredMark({ date: "2026-10-10" });

    const newProblemState = deriveState([masteredMark]);
    const activeProblemState = deriveState([activeAttempt, masteredMark]);

    expect(newProblemState).toEqual({ status: "mastered", since: "2026-10-10" });
    expect(activeProblemState).toEqual({ status: "mastered", since: "2026-10-10" });
  });

  it("restores the previous state when the latest attempt is deleted", () => {
    const first = anAttempt({ rating: "hard" });
    const deletedLatest = anAttempt({
      id: "attempt-2",
      date: "2026-10-03",
      rating: "easy",
      deletedAt: "2026-10-04T10:00:00.000Z",
    });

    const restoredState = deriveState([first, deletedLatest]);

    expect(restoredState).toEqual(deriveState([first]));
  });

  it("restores the previous state when a mastered mark is deleted", () => {
    const first = anAttempt({ rating: "hard" });
    const deletedMark = aMasteredMark({
      date: "2026-10-04",
      deletedAt: "2026-10-05T10:00:00.000Z",
    });

    const restoredState = deriveState([first, deletedMark]);

    expect(restoredState).toEqual(deriveState([first]));
  });

  it("replays by timestamp and id regardless of input order", () => {
    const first = anAttempt({ rating: "hard", completedAt: "2026-10-01T09:00:00.000Z" });
    const tiedA = anAttempt({ id: "a", rating: "medium" });
    const tiedB = anAttempt({ id: "b", rating: "easy" });
    const entries = [tiedB, first, tiedA];

    const state = deriveState(entries);

    expect(state).toEqual({ status: "active", lastRating: "easy", dueDate: "2026-10-31" });
    expect(deriveState([tiedA, tiedB, first])).toEqual(state);
    expect(entries).toEqual([tiedB, first, tiedA]);
  });
});

describe("deriveAllStates", () => {
  it("returns new, active, and mastered states for the requested problem ids", () => {
    const activeAttempt = anAttempt({ problemId: "active-problem", rating: "hard" });
    const masteredMark = aMasteredMark({ problemId: "mastered-problem" });

    const states = deriveAllStates(
      ["new-problem", "active-problem", "mastered-problem"],
      [masteredMark, activeAttempt],
    );

    expect(states).toEqual({
      "new-problem": { status: "new" },
      "active-problem": { status: "active", lastRating: "hard", dueDate: "2026-10-03" },
      "mastered-problem": { status: "mastered", since: "2026-10-01" },
    });
  });
});

describe("earliestDueDate", () => {
  it("returns the earliest due date among active problems", () => {
    const states: Record<string, ProblemState> = {
      first: { status: "active", lastRating: "medium", dueDate: "2026-10-08" },
      second: { status: "active", lastRating: "hard", dueDate: "2026-10-03" },
      third: { status: "mastered", since: "2026-10-01" },
    };

    const dueDate = earliestDueDate(states);

    expect(dueDate).toBe("2026-10-03");
  });

  it("returns null when no problems are active", () => {
    const states: Record<string, ProblemState> = {
      first: { status: "new" },
      second: { status: "mastered", since: "2026-10-01" },
    };

    const dueDate = earliestDueDate(states);

    expect(dueDate).toBeNull();
  });
});

describe("lastAttempt", () => {
  it("returns the latest non-deleted attempt for one problem", () => {
    const first = anAttempt({ id: "attempt-1" });
    const latest = anAttempt({ id: "attempt-2", date: "2026-10-08" });
    const deleted = anAttempt({
      id: "attempt-3",
      date: "2026-10-15",
      deletedAt: "2026-10-16T10:00:00.000Z",
    });
    const masteredMark = aMasteredMark({ date: "2026-10-20" });
    const otherProblem = anAttempt({ problemId: "other-problem", date: "2026-11-01" });

    const result = lastAttempt(
      [deleted, masteredMark, otherProblem, first, latest],
      "contains-duplicate",
    );

    expect(result).toEqual(latest);
  });

  it("returns undefined when the problem has no non-deleted attempts", () => {
    const masteredMark = aMasteredMark();
    const deleted = anAttempt({ deletedAt: "2026-10-02T10:00:00.000Z" });

    const result = lastAttempt([masteredMark, deleted], "contains-duplicate");

    expect(result).toBeUndefined();
  });
});
