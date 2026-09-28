import { describe, expect, it } from "vitest";

import { EMPTY_SAVE_FILE, type Attempt, type MarkedMastered, type SaveFile } from "@/domain/types";

import {
  CORRUPT_BACKUP_KEY_PREFIX,
  STORAGE_KEY,
  createLocalStore,
  exportJson,
  importJson,
} from "../localStore";

const DEFAULT_TIME_MINUTES = 20;

function anAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    type: "attempt",
    id: "attempt-1",
    problemId: "contains-duplicate",
    completedAt: "2026-10-01T12:00:00.000Z",
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
    problemId: "two-sum",
    at: "2026-10-02T13:00:00.000Z",
    date: "2026-10-02",
    ...overrides,
  };
}

function aSaveFile(overrides: Partial<SaveFile> = {}): SaveFile {
  return {
    version: 1,
    entries: [
      anAttempt({ startedAt: "2026-10-01T11:40:00.000Z", keyInsight: "Remember what was seen" }),
      aMasteredMark(),
      anAttempt({
        id: "attempt-2",
        completedAt: "2026-10-03T12:00:00.000Z",
        date: "2026-10-03",
        rating: "hard",
        help: "hint",
        deletedAt: "2026-10-03T12:05:00.000Z",
      }),
    ],
    settings: { timeBoxMinutes: { Easy: 10, Medium: 25, Hard: 50 }, showPatternOnReviews: true },
    ...overrides,
  };
}

function createMemoryStorage(initialItems: Record<string, string> = {}): Storage {
  const items = new Map(Object.entries(initialItems));
  return {
    get length() {
      return items.size;
    },
    key: (index) => [...items.keys()][index] ?? null,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => {
      items.set(key, value);
    },
    removeItem: (key) => {
      items.delete(key);
    },
    clear: () => {
      items.clear();
    },
  };
}

function throwStorageError(): never {
  throw new Error("Storage is disabled");
}

function createUnavailableStorage(): Storage {
  return {
    get length() {
      return throwStorageError();
    },
    key: throwStorageError,
    getItem: throwStorageError,
    setItem: throwStorageError,
    removeItem: throwStorageError,
    clear: throwStorageError,
  };
}

function keysOf(storage: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key !== null) keys.push(key);
  }
  return keys;
}

function errorOf(result: ReturnType<typeof importJson>): string {
  if (result.ok) {
    throw new Error("Expected the import to be rejected");
  }
  return result.error;
}

describe("createLocalStore", () => {
  it("returns the empty save file when nothing is stored", () => {
    const store = createLocalStore(createMemoryStorage());

    const file = store.load();

    expect(file).toEqual(EMPTY_SAVE_FILE);
  });

  it("round-trips a saved file exactly through load", () => {
    const storage = createMemoryStorage();
    const file = aSaveFile({
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-04T08:00:00.000Z" },
    });

    createLocalStore(storage).save(file);
    const loaded = createLocalStore(storage).load();

    expect(loaded).toEqual(file);
  });

  it("backs up corrupt stored data instead of overwriting it", () => {
    const corruptText = "{ this is not json";
    const storage = createMemoryStorage({ [STORAGE_KEY]: corruptText });

    const loaded = createLocalStore(storage).load();

    const backupKeys = keysOf(storage).filter((key) => key.startsWith(CORRUPT_BACKUP_KEY_PREFIX));
    expect(loaded).toEqual(EMPTY_SAVE_FILE);
    expect(storage.getItem(STORAGE_KEY)).toBe(corruptText);
    expect(backupKeys).toHaveLength(1);
    expect(storage.getItem(backupKeys[0] ?? "")).toBe(corruptText);
  });

  it("backs up stored JSON that is not a valid save file", () => {
    const invalidText = JSON.stringify({ ...aSaveFile(), version: 2 });
    const storage = createMemoryStorage({ [STORAGE_KEY]: invalidText });

    const loaded = createLocalStore(storage).load();

    const backupKeys = keysOf(storage).filter((key) => key.startsWith(CORRUPT_BACKUP_KEY_PREFIX));
    expect(loaded).toEqual(EMPTY_SAVE_FILE);
    expect(storage.getItem(STORAGE_KEY)).toBe(invalidText);
    expect(backupKeys.map((key) => storage.getItem(key))).toEqual([invalidText]);
  });

  it("keeps working in memory when storage throws", () => {
    const store = createLocalStore(createUnavailableStorage());
    const file = aSaveFile();

    const loadedBeforeSave = store.load();
    store.save(file);
    const loadedAfterSave = store.load();

    expect(loadedBeforeSave).toEqual(EMPTY_SAVE_FILE);
    expect(loadedAfterSave).toEqual(file);
  });

  it("keeps working in memory when there is no window storage", () => {
    const store = createLocalStore();
    const file = aSaveFile();

    store.save(file);
    const loaded = store.load();

    expect(loaded).toEqual(file);
  });
});

describe("exportJson and importJson", () => {
  it("restores the original entries and settings after export, clearing storage and import", () => {
    const storage = createMemoryStorage();
    const original = aSaveFile();
    createLocalStore(storage).save(original);
    const exported = exportJson(createLocalStore(storage).load());

    storage.clear();
    const emptyFile = createLocalStore(storage).load();
    const result = importJson(exported, emptyFile);

    expect(emptyFile).toEqual(EMPTY_SAVE_FILE);
    expect(result).toEqual({ ok: true, file: original, added: original.entries.length });
  });

  it("exports pretty-printed JSON", () => {
    const exported = exportJson(aSaveFile());

    expect(exported).toContain('\n  "version": 1');
  });

  it("adds nothing when the same file is imported twice", () => {
    const file = aSaveFile();
    const exported = exportJson(file);

    const firstImport = importJson(exported, EMPTY_SAVE_FILE);
    if (!firstImport.ok) throw new Error(firstImport.error);
    const secondImport = importJson(exported, firstImport.file);

    expect(firstImport.added).toBe(file.entries.length);
    expect(secondImport).toEqual({ ok: true, file: firstImport.file, added: 0 });
  });

  it("merges an import into a non-empty log and keeps the current settings", () => {
    const current = aSaveFile({ entries: [anAttempt({ id: "local-only" })] });
    const incoming = aSaveFile({
      entries: [aMasteredMark({ id: "remote-only" })],
      settings: { timeBoxMinutes: { Easy: 5, Medium: 5, Hard: 5 }, showPatternOnReviews: false },
    });

    const result = importJson(exportJson(incoming), current);

    expect(result).toEqual({
      ok: true,
      file: {
        ...current,
        entries: [anAttempt({ id: "local-only" }), aMasteredMark({ id: "remote-only" })],
      },
      added: 1,
    });
  });

  it("applies a deletion from the imported file without counting it as added", () => {
    const live = anAttempt();
    const current = aSaveFile({ entries: [live] });
    const incoming = aSaveFile({ entries: [{ ...live, deletedAt: "2026-10-05T10:00:00.000Z" }] });

    const result = importJson(exportJson(incoming), current);

    expect(result).toEqual({ ok: true, file: incoming, added: 0 });
  });

  it("rejects text that is not JSON with a readable error", () => {
    const result = importJson("not json at all", EMPTY_SAVE_FILE);

    expect(errorOf(result)).toBe("The file is not valid JSON.");
  });

  it("rejects a file with version 2 with a readable error", () => {
    const text = JSON.stringify({ ...aSaveFile(), version: 2 });

    const result = importJson(text, EMPTY_SAVE_FILE);

    expect(errorOf(result)).toMatch(/not a valid dta-learning save file[\s\S]*version/);
  });

  it("rejects a file with an unknown rating with a readable error", () => {
    const file = aSaveFile();
    const text = JSON.stringify({ ...file, entries: [{ ...file.entries[0], rating: "trivial" }] });

    const result = importJson(text, EMPTY_SAVE_FILE);

    expect(errorOf(result)).toMatch(/not a valid dta-learning save file[\s\S]*rating/);
  });

  it("leaves the current file untouched", () => {
    const current = aSaveFile({ entries: [anAttempt({ id: "local-only" })] });
    const snapshot = structuredClone(current);

    importJson(exportJson(aSaveFile()), current);

    expect(current).toEqual(snapshot);
  });
});
