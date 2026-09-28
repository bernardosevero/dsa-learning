import { describe, expect, it } from "vitest";

import { aMasteredMark, anAttempt } from "@/test/builders";

import { entryTimestamp } from "../types";

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
