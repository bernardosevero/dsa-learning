import { describe, expect, it } from "vitest";

import { EMPTY_SAVE_FILE } from "@/domain/types";
import { aMasteredMark, anAttempt, aSaveFile } from "@/test/builders";

import {
  CORRUPT_BACKUP_KEY_PREFIX,
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  createLocalStore,
  exportJson,
  importJson,
} from "../localStore";

// Every kind of entry and non-default settings, so a round trip that drops anything shows.
const SAMPLE_FILE = aSaveFile({
  entries: [
    anAttempt({ startedAt: "2026-10-01T11:40:00.000Z", keyInsight: "Remember what was seen" }),
    aMasteredMark({ problemId: "two-sum", date: "2026-10-02" }),
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
});

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
      ...SAMPLE_FILE,
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-04T08:00:00.000Z" },
    });

    createLocalStore(storage).save(file);
    const loaded = createLocalStore(storage).load();

    expect(loaded).toEqual(file);
  });

  it("moves progress saved under the old dta-learning key to the new key", () => {
    const savedText = JSON.stringify(SAMPLE_FILE);
    const storage = createMemoryStorage({ [LEGACY_STORAGE_KEY]: savedText });

    const loaded = createLocalStore(storage).load();

    expect(loaded).toEqual(SAMPLE_FILE);
    expect(storage.getItem(STORAGE_KEY)).toBe(savedText);
    expect(storage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  it("backs up a corrupt copy under the old key like any other corrupt data", () => {
    const corruptText = "{ this is not json";
    const storage = createMemoryStorage({ [LEGACY_STORAGE_KEY]: corruptText });

    const loaded = createLocalStore(storage).load();

    const backupKeys = keysOf(storage).filter((key) => key.startsWith(CORRUPT_BACKUP_KEY_PREFIX));
    expect(loaded).toEqual(EMPTY_SAVE_FILE);
    expect(storage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(backupKeys.map((key) => storage.getItem(key))).toEqual([corruptText]);
  });

  it("keeps the old key when the new key can't be written, still loading its progress", () => {
    const savedText = JSON.stringify(SAMPLE_FILE);
    const storage = { ...createMemoryStorage({ [LEGACY_STORAGE_KEY]: savedText }) };
    storage.setItem = throwStorageError;

    const loaded = createLocalStore(storage).load();

    expect(loaded).toEqual(SAMPLE_FILE);
    expect(storage.getItem(LEGACY_STORAGE_KEY)).toBe(savedText);
  });

  it("ignores the old key once the new key holds a save file", () => {
    const oldText = JSON.stringify(aSaveFile({ entries: [anAttempt()] }));
    const storage = createMemoryStorage({
      [STORAGE_KEY]: JSON.stringify(SAMPLE_FILE),
      [LEGACY_STORAGE_KEY]: oldText,
    });

    const loaded = createLocalStore(storage).load();

    expect(loaded).toEqual(SAMPLE_FILE);
    expect(storage.getItem(LEGACY_STORAGE_KEY)).toBe(oldText);
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
    const invalidText = JSON.stringify({ ...SAMPLE_FILE, version: 2 });
    const storage = createMemoryStorage({ [STORAGE_KEY]: invalidText });

    const loaded = createLocalStore(storage).load();

    const backupKeys = keysOf(storage).filter((key) => key.startsWith(CORRUPT_BACKUP_KEY_PREFIX));
    expect(loaded).toEqual(EMPTY_SAVE_FILE);
    expect(storage.getItem(STORAGE_KEY)).toBe(invalidText);
    expect(backupKeys.map((key) => storage.getItem(key))).toEqual([invalidText]);
  });

  it("keeps working in memory when storage throws", () => {
    const store = createLocalStore(createUnavailableStorage());
    const file = SAMPLE_FILE;

    const loadedBeforeSave = store.load();
    store.save(file);
    const loadedAfterSave = store.load();

    expect(loadedBeforeSave).toEqual(EMPTY_SAVE_FILE);
    expect(loadedAfterSave).toEqual(file);
  });

  it("keeps working in memory when there is no window storage", () => {
    const store = createLocalStore();
    const file = SAMPLE_FILE;

    store.save(file);
    const loaded = store.load();

    expect(loaded).toEqual(file);
  });
});

describe("exportJson and importJson", () => {
  it("restores the original entries and settings after export, clearing storage and import", () => {
    const storage = createMemoryStorage();
    const original = SAMPLE_FILE;
    createLocalStore(storage).save(original);
    const exported = exportJson(createLocalStore(storage).load());

    storage.clear();
    const emptyFile = createLocalStore(storage).load();
    const result = importJson(exported, emptyFile);

    expect(emptyFile).toEqual(EMPTY_SAVE_FILE);
    expect(result).toEqual({ ok: true, file: original, added: original.entries.length });
  });

  it("exports pretty-printed JSON", () => {
    const exported = exportJson(SAMPLE_FILE);

    expect(exported).toContain('\n  "version": 1');
  });

  it("adds nothing when the same file is imported twice", () => {
    const file = SAMPLE_FILE;
    const exported = exportJson(file);

    const firstImport = importJson(exported, EMPTY_SAVE_FILE);
    if (!firstImport.ok) throw new Error(firstImport.error);
    const secondImport = importJson(exported, firstImport.file);

    expect(firstImport.added).toBe(file.entries.length);
    expect(secondImport).toEqual({ ok: true, file: firstImport.file, added: 0 });
  });

  it("merges an import into a non-empty log and keeps the current settings", () => {
    const current = aSaveFile({ ...SAMPLE_FILE, entries: [anAttempt({ id: "local-only" })] });
    const incoming = aSaveFile({
      ...SAMPLE_FILE,
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
    const current = aSaveFile({ ...SAMPLE_FILE, entries: [live] });
    const incoming = aSaveFile({
      ...SAMPLE_FILE,
      entries: [{ ...live, deletedAt: "2026-10-05T10:00:00.000Z" }],
    });

    const result = importJson(exportJson(incoming), current);

    expect(result).toEqual({ ok: true, file: incoming, added: 0 });
  });

  it("keeps an entry undone here when an older export that still has it is imported", () => {
    const live = anAttempt();
    const olderExport = exportJson(aSaveFile({ ...SAMPLE_FILE, entries: [live] }));
    const current = aSaveFile({
      ...SAMPLE_FILE,
      entries: [{ ...live, deletedAt: "2026-10-05T10:00:00.000Z" }],
    });

    const result = importJson(olderExport, current);

    expect(result).toEqual({ ok: true, file: current, added: 0 });
  });

  it("rejects text that is not JSON with a readable error", () => {
    const result = importJson("not json at all", EMPTY_SAVE_FILE);

    expect(errorOf(result)).toBe("The file is not valid JSON.");
  });

  it("rejects a file with version 2 with a readable error", () => {
    const text = JSON.stringify({ ...SAMPLE_FILE, version: 2 });

    const result = importJson(text, EMPTY_SAVE_FILE);

    expect(errorOf(result)).toMatch(/not a valid dsa-learning save file[\s\S]*version/);
  });

  it("rejects a file with an unknown rating with a readable error", () => {
    const file = SAMPLE_FILE;
    const text = JSON.stringify({ ...file, entries: [{ ...file.entries[0], rating: "trivial" }] });

    const result = importJson(text, EMPTY_SAVE_FILE);

    expect(errorOf(result)).toMatch(/not a valid dsa-learning save file[\s\S]*rating/);
  });

  it("leaves the current file untouched", () => {
    const current = aSaveFile({ ...SAMPLE_FILE, entries: [anAttempt({ id: "local-only" })] });
    const snapshot = structuredClone(current);

    importJson(exportJson(SAMPLE_FILE), current);

    expect(current).toEqual(snapshot);
  });
});
