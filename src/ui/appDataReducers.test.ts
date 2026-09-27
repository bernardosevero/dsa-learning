import { describe, expect, it } from "vitest";

import { EMPTY_SAVE_FILE, type Attempt, type MarkedMastered, type SaveFile } from "@/domain/types";

import {
  addAttempt,
  clearTimer,
  deleteEntry,
  markMastered,
  resetProgress,
  startTimer,
  updateSettings,
  type NewAttempt,
} from "./appDataReducers";

const DEFAULT_TIME_MINUTES = 20;
const UUID = "0b8f2d6e-4c1a-4f3b-9a7e-2d5c8e1f3a90";
const DELETED_AT = "2026-10-03T09:00:00.000Z";

function aNewAttempt(overrides: Partial<NewAttempt> = {}): NewAttempt {
  return {
    problemId: "contains-duplicate",
    completedAt: "2026-10-01T12:00:00.000Z",
    date: "2026-10-01",
    rating: "medium",
    timeMinutes: DEFAULT_TIME_MINUTES,
    help: "none",
    ...overrides,
  };
}

function anAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return { ...aNewAttempt(), type: "attempt", id: "attempt-1", ...overrides };
}

function aMasteredMark(overrides: Partial<MarkedMastered> = {}): MarkedMastered {
  return {
    type: "markedMastered",
    id: "mark-1",
    problemId: "two-sum",
    at: "2026-10-02T13:00:00.000Z",
    date: "2026-10-02",
    ...overrides,
  };
}

function aSaveFile(overrides: Partial<SaveFile> = {}): SaveFile {
  return { ...EMPTY_SAVE_FILE, ...overrides };
}

describe("addAttempt", () => {
  it("appends one attempt entry carrying the given uuid", () => {
    const file = aSaveFile({ entries: [anAttempt()] });

    const updated = addAttempt(file, aNewAttempt({ rating: "hard" }), UUID);

    expect(updated.entries).toHaveLength(2);
    expect(updated.entries[1]).toEqual({
      ...aNewAttempt({ rating: "hard" }),
      type: "attempt",
      id: UUID,
    });
  });

  it("leaves the original file untouched", () => {
    const file = aSaveFile();

    addAttempt(file, aNewAttempt(), UUID);

    expect(file.entries).toHaveLength(0);
  });
});

describe("markMastered", () => {
  it("appends a mastered mark for the problem", () => {
    const file = aSaveFile();
    const mark = {
      id: UUID,
      problemId: "two-sum",
      at: "2026-10-02T13:00:00.000Z",
      date: "2026-10-02",
    };

    const updated = markMastered(file, mark);

    expect(updated.entries).toEqual([{ ...mark, type: "markedMastered" }]);
  });
});

describe("deleteEntry", () => {
  it("sets deletedAt on the entry and keeps it in the log", () => {
    const file = aSaveFile({ entries: [anAttempt({ id: "keep" }), aMasteredMark({ id: "undo" })] });

    const updated = deleteEntry(file, "undo", DELETED_AT);

    expect(updated.entries).toEqual([
      anAttempt({ id: "keep" }),
      aMasteredMark({ id: "undo", deletedAt: DELETED_AT }),
    ]);
  });

  it("keeps the first deletion time when the entry is already deleted", () => {
    const firstDeletion = "2026-10-02T08:00:00.000Z";
    const file = aSaveFile({ entries: [anAttempt({ deletedAt: firstDeletion })] });

    const updated = deleteEntry(file, "attempt-1", DELETED_AT);

    expect(updated.entries[0]?.deletedAt).toBe(firstDeletion);
  });

  it("changes nothing when no entry has the id", () => {
    const file = aSaveFile({ entries: [anAttempt()] });

    const updated = deleteEntry(file, "missing", DELETED_AT);

    expect(updated.entries).toEqual(file.entries);
  });
});

describe("updateSettings", () => {
  it("replaces only the given settings", () => {
    const file = aSaveFile();

    const updated = updateSettings(file, { showPatternOnReviews: true });

    expect(updated.settings).toEqual({ ...file.settings, showPatternOnReviews: true });
  });
});

describe("startTimer and clearTimer", () => {
  it("starts a timer for the problem, replacing a running one", () => {
    const file = aSaveFile({
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-01T09:00:00Z" },
    });

    const updated = startTimer(file, "valid-anagram", "2026-10-01T10:00:00Z");

    expect(updated.activeTimer).toEqual({
      problemId: "valid-anagram",
      startedAt: "2026-10-01T10:00:00Z",
    });
  });

  it("clears the running timer", () => {
    const file = aSaveFile({
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-01T09:00:00Z" },
    });

    const updated = clearTimer(file);

    expect(updated).not.toHaveProperty("activeTimer");
    expect(file.activeTimer).toBeDefined();
  });
});

describe("resetProgress", () => {
  it("marks every entry deleted, keeps them all and clears the timer", () => {
    const file = aSaveFile({
      entries: [anAttempt(), aMasteredMark()],
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-01T09:00:00Z" },
    });

    const updated = resetProgress(file, DELETED_AT);

    expect(updated.entries).toEqual([
      anAttempt({ deletedAt: DELETED_AT }),
      aMasteredMark({ deletedAt: DELETED_AT }),
    ]);
    expect(updated).not.toHaveProperty("activeTimer");
  });
});
