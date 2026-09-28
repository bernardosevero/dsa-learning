import { describe, expect, it } from "vitest";

import { aMasteredMark, anAttempt } from "@/test/builders";

import { problemHistory, timeTrend } from "../history";

describe("problemHistory", () => {
  it("returns the problem's entries newest first", () => {
    const first = anAttempt({ id: "first", date: "2026-09-03" });
    const second = anAttempt({ id: "second", date: "2026-09-17" });
    const mark = aMasteredMark({ id: "mark", date: "2026-09-20" });

    const history = problemHistory([second, mark, first], "contains-duplicate");

    expect(history.map((entry) => entry.id)).toEqual(["mark", "second", "first"]);
  });

  it("leaves out other problems' entries", () => {
    const own = anAttempt({ id: "own" });
    const other = anAttempt({ id: "other", problemId: "two-sum" });

    const history = problemHistory([own, other], "contains-duplicate");

    expect(history.map((entry) => entry.id)).toEqual(["own"]);
  });

  it("leaves out deleted entries", () => {
    const kept = anAttempt({ id: "kept", date: "2026-09-03" });
    const deleted = anAttempt({
      id: "deleted",
      date: "2026-09-17",
      deletedAt: "2026-09-18T08:00:00.000Z",
    });

    const history = problemHistory([kept, deleted], "contains-duplicate");

    expect(history.map((entry) => entry.id)).toEqual(["kept"]);
  });
});

describe("timeTrend", () => {
  it("returns the first and the latest attempt's minutes", () => {
    const history = [
      anAttempt({ id: "latest", date: "2026-09-17", timeMinutes: 24 }),
      aMasteredMark({ date: "2026-09-10" }),
      anAttempt({ id: "first", date: "2026-09-03", timeMinutes: 41 }),
    ];

    const trend = timeTrend(history);

    expect(trend).toEqual({ firstMinutes: 41, latestMinutes: 24 });
  });

  it("is null with fewer than two attempts", () => {
    const history = [anAttempt({ timeMinutes: 24 }), aMasteredMark()];

    const trend = timeTrend(history);

    expect(trend).toBeNull();
  });
});
