import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_SAVE_FILE, type Attempt, type MarkedMastered, type SaveFile } from "@/domain/types";

import { addAttempt, deleteEntry, resetProgress, type NewAttempt } from "./appDataReducers";

const DEFAULT_TIME_MINUTES = 20;
const NOW = "2026-10-03T09:00:00.000Z";
const UUID_PATTERN = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/;

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

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(NOW) });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("addAttempt", () => {
  it("appends one attempt entry with a uuid", () => {
    const file = aSaveFile({ entries: [anAttempt()] });

    const updated = addAttempt(file, aNewAttempt({ rating: "hard" }));

    expect(updated.entries).toHaveLength(2);
    expect(updated.entries[1]).toMatchObject({
      ...aNewAttempt({ rating: "hard" }),
      type: "attempt",
    });
    expect(updated.entries[1]?.id).toMatch(UUID_PATTERN);
  });
});

describe("deleteEntry", () => {
  it("sets deletedAt on the entry and keeps it in the log", () => {
    const file = aSaveFile({ entries: [anAttempt({ id: "keep" }), aMasteredMark({ id: "undo" })] });

    const updated = deleteEntry(file, "undo");

    expect(updated.entries).toEqual([
      anAttempt({ id: "keep" }),
      aMasteredMark({ id: "undo", deletedAt: NOW }),
    ]);
  });
});

describe("resetProgress", () => {
  it("marks every entry deleted, keeps them all and clears the timer", () => {
    const file = aSaveFile({
      entries: [anAttempt(), aMasteredMark()],
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-01T09:00:00.000Z" },
    });

    const updated = resetProgress(file);

    expect(updated.entries).toEqual([
      anAttempt({ deletedAt: NOW }),
      aMasteredMark({ deletedAt: NOW }),
    ]);
    expect(updated).not.toHaveProperty("activeTimer");
  });
});
