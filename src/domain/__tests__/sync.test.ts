import { describe, expect, it } from "vitest";

import { aMasteredMark, anAttempt, aRemoteSave, aSaveFile } from "@/test/builders";

import { reconcile } from "../sync";
import { DEFAULT_SETTINGS, type Attempt, type Settings } from "../types";

const PATTERN_SHOWN: Settings = { ...DEFAULT_SETTINGS, showPatternOnReviews: true };
const LONGER_TIME_BOXES: Settings = {
  ...DEFAULT_SETTINGS,
  timeBoxMinutes: { Easy: 20, Medium: 40, Hard: 60 },
};

describe("reconcile", () => {
  it("uploads the whole local log on the account's first sync", () => {
    const local = aSaveFile({ entries: [anAttempt()], settings: PATTERN_SHOWN });

    const result = reconcile(local, undefined, undefined);

    expect(result.file).toBe(local);
    expect(result.toWrite).toEqual({ entries: [anAttempt()], settings: PATTERN_SHOWN });
  });

  it("merges a log from another device into the local one", () => {
    const localAttempt = anAttempt({ id: "local", completedAt: "2026-10-01T12:00:00.000Z" });
    const remoteMark = aMasteredMark({ id: "remote", at: "2026-10-02T12:00:00.000Z" });
    const local = aSaveFile({ entries: [localAttempt] });
    const remote = aRemoteSave({ entries: [remoteMark] });

    const result = reconcile(local, remote, DEFAULT_SETTINGS);

    expect(result.file.entries).toEqual([localAttempt, remoteMark]);
    expect(result.toWrite?.entries).toEqual([localAttempt, remoteMark]);
  });

  it("keeps an entry deleted when the other side still has it live", () => {
    const deleted = anAttempt({ deletedAt: "2026-10-02T09:00:00.000Z" });
    const local = aSaveFile({ entries: [deleted] });
    const remote = aRemoteSave({ entries: [anAttempt()] });

    const result = reconcile(local, remote, DEFAULT_SETTINGS);

    expect(result.file.entries).toEqual([deleted]);
    expect(result.toWrite?.entries).toEqual([deleted]);
  });

  it("takes a deletion made on another device", () => {
    const deleted = anAttempt({ deletedAt: "2026-10-02T09:00:00.000Z" });
    const local = aSaveFile({ entries: [anAttempt()] });
    const remote = aRemoteSave({ entries: [deleted] });

    const result = reconcile(local, remote, DEFAULT_SETTINGS);

    expect(result.file.entries).toEqual([deleted]);
    expect(result.toWrite).toBeUndefined();
  });

  it("writes nothing when the row already holds the merged log", () => {
    const entries = [anAttempt({ id: "a" }), aMasteredMark({ id: "b" })];
    const local = aSaveFile({ entries });
    const remote = aRemoteSave({ entries });

    const result = reconcile(local, remote, DEFAULT_SETTINGS);

    expect(result.toWrite).toBeUndefined();
  });

  it("writes nothing when the row holds the same data with its keys in another order", () => {
    const attempt = anAttempt();
    const local = aSaveFile({ entries: [attempt] });
    // Postgres jsonb stores object keys in its own order.
    const { help, timeMinutes, rating, date, completedAt, problemId, id, type } = attempt;
    const reorderedAttempt: Attempt = {
      help,
      timeMinutes,
      rating,
      date,
      completedAt,
      problemId,
      id,
      type,
    };
    const reorderedSettings: Settings = {
      shareAnonymousUsage: true,
      showPatternOnReviews: false,
      timeBoxMinutes: { Hard: 45, Medium: 30, Easy: 15 },
    };
    const remote = aRemoteSave({ entries: [reorderedAttempt], settings: reorderedSettings });

    const result = reconcile(local, remote, DEFAULT_SETTINGS);

    expect(result.toWrite).toBeUndefined();
  });

  it("keeps local settings changed since the last sync", () => {
    const local = aSaveFile({ settings: PATTERN_SHOWN });
    const remote = aRemoteSave({ settings: LONGER_TIME_BOXES });

    const result = reconcile(local, remote, DEFAULT_SETTINGS);

    expect(result.file.settings).toEqual(PATTERN_SHOWN);
    expect(result.toWrite?.settings).toEqual(PATTERN_SHOWN);
  });

  it("takes the account's settings when they weren't changed on this device", () => {
    const local = aSaveFile({ settings: DEFAULT_SETTINGS });
    const remote = aRemoteSave({ settings: LONGER_TIME_BOXES });

    const result = reconcile(local, remote, DEFAULT_SETTINGS);

    expect(result.file.settings).toEqual(LONGER_TIME_BOXES);
    expect(result.toWrite).toBeUndefined();
  });

  it("takes the account's settings on this device's first sync", () => {
    const local = aSaveFile({ settings: PATTERN_SHOWN });
    const remote = aRemoteSave({ settings: LONGER_TIME_BOXES });

    const result = reconcile(local, remote, undefined);

    expect(result.file.settings).toEqual(LONGER_TIME_BOXES);
    expect(result.toWrite).toBeUndefined();
  });

  it("never syncs the running timer", () => {
    const activeTimer = { problemId: "two-sum", startedAt: "2026-10-01T10:00:00.000Z" };
    const local = aSaveFile({ entries: [anAttempt()], activeTimer });
    const remote = aRemoteSave({ entries: [aMasteredMark()] });

    const result = reconcile(local, remote, DEFAULT_SETTINGS);

    expect(result.file.activeTimer).toEqual(activeTimer);
    expect(result.toWrite).not.toHaveProperty("activeTimer");
  });

  it("returns the local file itself when nothing came in", () => {
    const local = aSaveFile({ entries: [anAttempt()] });
    const remote = aRemoteSave({ entries: [anAttempt()] });

    const result = reconcile(local, remote, DEFAULT_SETTINGS);

    expect(result.file).toBe(local);
  });
});
