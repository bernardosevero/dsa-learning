import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { today } from "@/domain/dates";
import { exportJson, importJson } from "@/storage/localStore";
import { aMasteredMark, anAttempt, aNewAttempt, aSaveFile } from "@/test/builders";

import {
  addAttempt,
  clearTimer,
  deleteEntry,
  markMastered,
  resetProgress,
  resetProgressEverywhere,
  restartTimer,
  startTimer,
  updateSettings,
} from "../appDataReducers";

const NOW = "2026-10-03T09:00:00.000Z";
const UUID_PATTERN = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/;

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

  it("leaves the original file untouched", () => {
    const file = aSaveFile();

    addAttempt(file, aNewAttempt());

    expect(file.entries).toHaveLength(0);
  });
});

describe("markMastered", () => {
  it("appends a mastered mark for the problem, dated now", () => {
    const file = aSaveFile();

    const updated = markMastered(file, "two-sum");

    expect(updated.entries).toHaveLength(1);
    expect(updated.entries[0]).toMatchObject({
      type: "markedMastered",
      problemId: "two-sum",
      at: NOW,
      date: today(),
    });
    expect(updated.entries[0]?.id).toMatch(UUID_PATTERN);
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

  it("keeps the first deletion time when the entry is already deleted", () => {
    const firstDeletion = "2026-10-02T08:00:00.000Z";
    const file = aSaveFile({ entries: [anAttempt({ deletedAt: firstDeletion })] });

    const updated = deleteEntry(file, "attempt-1");

    expect(updated.entries[0]?.deletedAt).toBe(firstDeletion);
  });

  it("changes nothing when no entry has the id", () => {
    const file = aSaveFile({ entries: [anAttempt()] });

    const updated = deleteEntry(file, "missing");

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

describe("startTimer, restartTimer and clearTimer", () => {
  it("starts a timer for the problem now, replacing a running one", () => {
    const file = aSaveFile({
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-01T09:00:00.000Z" },
    });

    const updated = startTimer(file, "valid-anagram");

    expect(updated.activeTimer).toEqual({ problemId: "valid-anagram", startedAt: NOW });
  });

  it("keeps a timer already running for the same problem", () => {
    const running = { problemId: "two-sum", startedAt: "2026-10-01T09:00:00.000Z" };
    const file = aSaveFile({ activeTimer: running });

    const updated = startTimer(file, "two-sum");

    expect(updated.activeTimer).toEqual(running);
  });

  it("clears the running timer", () => {
    const file = aSaveFile({
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-01T09:00:00.000Z" },
    });

    const updated = clearTimer(file);

    expect(updated).not.toHaveProperty("activeTimer");
    expect(file.activeTimer).toBeDefined();
  });

  it("restarts the problem's running timer from now, leaving the input untouched", () => {
    const running = { problemId: "two-sum", startedAt: "2026-10-01T09:00:00.000Z" };
    const file = aSaveFile({ activeTimer: running });

    const updated = restartTimer(file, "two-sum");

    expect(updated.activeTimer).toEqual({ problemId: "two-sum", startedAt: NOW });
    expect(file.activeTimer).toEqual(running);
  });
});

describe("resetProgress", () => {
  const CUSTOM_SETTINGS = {
    timeBoxMinutes: { Easy: 10, Medium: 20, Hard: 40 },
    showPatternOnReviews: true,
    shareAnonymousUsage: false,
  };

  it("empties the log, clears the timer and keeps the settings", () => {
    const file = aSaveFile({
      entries: [anAttempt(), aMasteredMark()],
      settings: CUSTOM_SETTINGS,
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-01T09:00:00.000Z" },
    });

    const updated = resetProgress(file);

    expect(updated).toEqual(aSaveFile({ entries: [], settings: CUSTOM_SETTINGS }));
    expect(updated).not.toHaveProperty("activeTimer");
  });

  it("brings back every entry when an export made before the reset is imported", () => {
    const undone = aMasteredMark({ id: "undone", deletedAt: NOW });
    const file = aSaveFile({ entries: [anAttempt(), aMasteredMark(), undone] });
    const exported = exportJson(file);

    const restored = importJson(exported, resetProgress(file));

    expect(restored).toEqual({ ok: true, file, added: file.entries.length });
  });

  it("takes the imported file's settings on the first import after a reset", () => {
    const current = aSaveFile({ entries: [anAttempt({ id: "local" })] });
    const exported = exportJson(
      aSaveFile({ entries: [anAttempt({ id: "remote" })], settings: CUSTOM_SETTINGS }),
    );

    const restored = importJson(exported, resetProgress(current));

    expect(restored).toEqual({
      ok: true,
      file: aSaveFile({ entries: [anAttempt({ id: "remote" })], settings: CUSTOM_SETTINGS }),
      added: 1,
    });
  });
});

describe("resetProgressEverywhere", () => {
  it("marks every entry deleted, keeps earlier deletions, drops the timer and keeps the settings", () => {
    const earlierDeletion = "2026-09-01T09:00:00.000Z";
    const file = aSaveFile({
      entries: [
        anAttempt({ id: "live" }),
        aMasteredMark({ id: "already-deleted", deletedAt: earlierDeletion }),
      ],
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-01T10:00:00.000Z" },
    });

    const updated = resetProgressEverywhere(file);

    expect(updated.entries.map((entry) => entry.id)).toEqual(["live", "already-deleted"]);
    expect(updated.entries[0]?.deletedAt).toBeDefined();
    expect(updated.entries[1]?.deletedAt).toBe(earlierDeletion);
    expect(updated).not.toHaveProperty("activeTimer");
    expect(updated.settings).toEqual(file.settings);
  });
});
