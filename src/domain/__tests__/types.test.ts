import { describe, expect, it } from "vitest";

import { entryTimestamp, type Attempt, type MarkedMastered } from "../types";

function anAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    type: "attempt",
    id: "attempt-1",
    problemId: "contains-duplicate",
    completedAt: "2026-09-27T10:30:00.000Z",
    date: "2026-09-27",
    rating: "medium",
    timeMinutes: 20,
    help: "none",
    ...overrides,
  };
}

function aMasteredMark(overrides: Partial<MarkedMastered> = {}): MarkedMastered {
  return {
    type: "markedMastered",
    id: "mark-1",
    problemId: "contains-duplicate",
    at: "2026-09-27T11:00:00.000Z",
    date: "2026-09-27",
    ...overrides,
  };
}

describe("entryTimestamp", () => {
  it("returns completedAt for an attempt and at for a mastered mark", () => {
    const attempt = anAttempt({ completedAt: "2026-09-20T08:00:00.000Z" });
    const mark = aMasteredMark({ at: "2026-09-21T09:00:00.000Z" });

    const attemptTimestamp = entryTimestamp(attempt);
    const markTimestamp = entryTimestamp(mark);

    expect(attemptTimestamp).toBe("2026-09-20T08:00:00.000Z");
    expect(markTimestamp).toBe("2026-09-21T09:00:00.000Z");
  });
});
