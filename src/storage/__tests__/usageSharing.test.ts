// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SaveFile } from "@/domain/types";
import { aMasteredMark, anAttempt, aSaveFile } from "@/test/builders";

import { STORAGE_KEY } from "../localStore";
import {
  readUsageSharing,
  saveWithCurrentUsageSharing,
  setUsageSharing,
  subscribeUsageSharing,
} from "../usageSharing";

// Entries with a tombstone, a running timer and non-default settings, so a lost field shows.
const FULL_SAVE = aSaveFile({
  entries: [
    anAttempt(),
    aMasteredMark({ problemId: "two-sum", deletedAt: "2026-10-02T09:00:00.000Z" }),
  ],
  settings: {
    timeBoxMinutes: { Easy: 10, Medium: 25, Hard: 50 },
    showPatternOnReviews: true,
    shareAnonymousUsage: true,
  },
  activeTimer: { problemId: "valid-anagram", startedAt: "2026-10-03T08:00:00.000Z" },
});

function storeFile(file: SaveFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
}

function readStoredFile(): SaveFile {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as SaveFile; // safe: written by the store
}

function dispatchStorageEvent(key: string | null): void {
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

afterEach(() => {
  localStorage.clear();
});

describe("readUsageSharing", () => {
  it("returns the saved choice", () => {
    storeFile(aSaveFile({ settings: { ...FULL_SAVE.settings, shareAnonymousUsage: false } }));

    expect(readUsageSharing()).toBe(false);
  });

  it("returns the default without saving an empty file", () => {
    expect(readUsageSharing()).toBe(true);

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("setUsageSharing", () => {
  it("changes only the choice, keeping every entry, tombstone, the timer and other settings", () => {
    storeFile(FULL_SAVE);

    setUsageSharing(false);

    expect(readStoredFile()).toEqual({
      ...FULL_SAVE,
      settings: { ...FULL_SAVE.settings, shareAnonymousUsage: false },
    });
  });

  it("changes the latest save, not an earlier one", () => {
    storeFile(FULL_SAVE);
    readUsageSharing();
    const newerSave = { ...FULL_SAVE, entries: [...FULL_SAVE.entries, anAttempt({ id: "new" })] };
    storeFile(newerSave);

    setUsageSharing(false);

    expect(readStoredFile().entries).toEqual(newerSave.entries);
  });

  it("tells subscribers in this document only when the choice changes", () => {
    storeFile(FULL_SAVE);
    const listener = vi.fn();
    const unsubscribe = subscribeUsageSharing(listener);

    setUsageSharing(true);
    setUsageSharing(false);
    unsubscribe();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(false);
  });
});

describe("subscribeUsageSharing", () => {
  it("rereads the choice when another tab changes the save or clears storage", () => {
    storeFile(aSaveFile({ settings: { ...FULL_SAVE.settings, shareAnonymousUsage: false } }));
    const listener = vi.fn();
    const unsubscribe = subscribeUsageSharing(listener);

    dispatchStorageEvent(STORAGE_KEY);
    localStorage.clear();
    dispatchStorageEvent(null);
    unsubscribe();

    expect(listener.mock.calls).toEqual([[false], [true]]);
  });

  it("ignores storage events for other keys", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUsageSharing(listener);

    dispatchStorageEvent("dsa-learning:sync");
    unsubscribe();

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops listening to both kinds of change once unsubscribed", () => {
    storeFile(FULL_SAVE);
    const listener = vi.fn();
    const unsubscribe = subscribeUsageSharing(listener);

    unsubscribe();
    setUsageSharing(false);
    dispatchStorageEvent(STORAGE_KEY);

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("saveWithCurrentUsageSharing", () => {
  it("keeps an opt-out through a save of an older copy of the file", () => {
    const olderCopy = FULL_SAVE;
    storeFile(FULL_SAVE);
    setUsageSharing(false);

    saveWithCurrentUsageSharing({
      ...olderCopy,
      entries: [...olderCopy.entries, anAttempt({ id: "new" })],
    });

    expect(readStoredFile().settings.shareAnonymousUsage).toBe(false);
    expect(readStoredFile().entries).toHaveLength(FULL_SAVE.entries.length + 1);
    expect(readUsageSharing()).toBe(false);
  });

  it("tells no subscribers", () => {
    storeFile(FULL_SAVE);
    const listener = vi.fn();
    const unsubscribe = subscribeUsageSharing(listener);

    saveWithCurrentUsageSharing({
      ...FULL_SAVE,
      settings: { ...FULL_SAVE.settings, shareAnonymousUsage: false },
    });
    unsubscribe();

    expect(listener).not.toHaveBeenCalled();
    expect(readStoredFile().settings.shareAnonymousUsage).toBe(true);
  });
});

describe("with localStorage blocked", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("keeps the choice in the same in-memory store the app saves through", async () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.resetModules();
    const bridge = await import("../usageSharing");
    const { getBrowserStore } = await import("../localStore");

    bridge.setUsageSharing(false);
    bridge.saveWithCurrentUsageSharing(FULL_SAVE);

    expect(bridge.readUsageSharing()).toBe(false);
    expect(getBrowserStore().load().entries).toEqual(FULL_SAVE.entries);
    vi.restoreAllMocks();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
