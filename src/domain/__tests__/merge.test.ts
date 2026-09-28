import { describe, expect, it } from "vitest";

import { aMasteredMark, anAttempt } from "@/test/builders";

import { mergeEntries } from "../merge";
import type { Entry } from "../types";

function idsOf(entries: readonly Entry[]): string[] {
  return entries.map((entry) => entry.id);
}

describe("mergeEntries", () => {
  it("returns the union of both logs by id", () => {
    const shared = anAttempt({ id: "shared" });
    const onlyCurrent = anAttempt({ id: "only-current", completedAt: "2026-10-02T12:00:00.000Z" });
    const onlyIncoming = aMasteredMark({ id: "only-incoming", at: "2026-10-03T12:00:00.000Z" });

    const merged = mergeEntries([shared, onlyCurrent], [onlyIncoming, shared]);

    expect(merged).toEqual([shared, onlyCurrent, onlyIncoming]);
  });

  it("sorts the result by timestamp, then by id", () => {
    const late = anAttempt({ id: "late", completedAt: "2026-10-05T12:00:00.000Z" });
    const tiedB = anAttempt({ id: "b", completedAt: "2026-10-01T12:00:00.000Z" });
    const tiedA = aMasteredMark({ id: "a", at: "2026-10-01T12:00:00.000Z" });

    const merged = mergeEntries([late, tiedB], [tiedA]);

    expect(idsOf(merged)).toEqual(["a", "b", "late"]);
  });

  it("keeps the deleted version when only the incoming side deleted an entry", () => {
    const live = anAttempt();
    const deleted = anAttempt({ deletedAt: "2026-10-02T09:00:00.000Z" });

    const merged = mergeEntries([live], [deleted]);

    expect(merged).toEqual([deleted]);
  });

  it("keeps the deleted version when only the current side deleted an entry", () => {
    const deleted = anAttempt({ deletedAt: "2026-10-02T09:00:00.000Z" });
    const live = anAttempt();

    const merged = mergeEntries([deleted], [live]);

    expect(merged).toEqual([deleted]);
  });

  it("keeps the earliest deletion when both sides deleted an entry", () => {
    const deletedEarly = anAttempt({ deletedAt: "2026-10-02T09:00:00.000Z" });
    const deletedLate = anAttempt({ deletedAt: "2026-10-04T09:00:00.000Z" });

    const mergedOneWay = mergeEntries([deletedLate], [deletedEarly]);
    const mergedOtherWay = mergeEntries([deletedEarly], [deletedLate]);

    expect(mergedOneWay).toEqual([deletedEarly]);
    expect(mergedOtherWay).toEqual([deletedEarly]);
  });

  it("changes nothing when a log is merged with itself", () => {
    const log = [
      anAttempt({ id: "first" }),
      aMasteredMark({ id: "second", at: "2026-10-02T12:00:00.000Z" }),
      anAttempt({
        id: "third",
        completedAt: "2026-10-03T12:00:00.000Z",
        deletedAt: "2026-10-04T12:00:00.000Z",
      }),
    ];

    const merged = mergeEntries(log, log);
    const mergedAgain = mergeEntries(merged, log);

    expect(merged).toEqual(log);
    expect(mergedAgain).toEqual(merged);
  });

  it("gives the same result whichever log comes first", () => {
    const current = [
      anAttempt({ id: "shared", deletedAt: "2026-10-05T12:00:00.000Z" }),
      anAttempt({ id: "only-current", completedAt: "2026-10-02T12:00:00.000Z" }),
    ];
    const incoming = [
      anAttempt({ id: "shared" }),
      aMasteredMark({ id: "only-incoming", at: "2026-09-30T12:00:00.000Z" }),
    ];

    const currentFirst = mergeEntries(current, incoming);
    const incomingFirst = mergeEntries(incoming, current);

    expect(currentFirst).toEqual(incomingFirst);
  });

  it("returns a new array and leaves both inputs untouched", () => {
    const live = anAttempt({ id: "b", completedAt: "2026-10-03T12:00:00.000Z" });
    const current = [live];
    const incoming = [anAttempt({ id: "a" }), { ...live, deletedAt: "2026-10-04T12:00:00.000Z" }];
    const currentSnapshot = structuredClone(current);
    const incomingSnapshot = structuredClone(incoming);

    const merged = mergeEntries(current, incoming);

    expect(merged).not.toBe(current);
    expect(merged).not.toBe(incoming);
    expect(current).toEqual(currentSnapshot);
    expect(incoming).toEqual(incomingSnapshot);
  });

  it("returns an empty log when both sides are empty", () => {
    const merged = mergeEntries([], []);

    expect(merged).toEqual([]);
  });
});
