import { mergeEntries } from "@/domain/merge";
import { EMPTY_SAVE_FILE, type SaveFile } from "@/domain/types";

import { parseSaveFile } from "./saveFile";

/** Loads and saves the whole save file. A backend store can replace this later. */
export interface Store {
  load(): SaveFile;
  save(file: SaveFile): void;
}

export const STORAGE_KEY = "dta-learning:v1";
/** Invalid stored data is copied to this prefix plus an ISO time instead of being overwritten. */
export const CORRUPT_BACKUP_KEY_PREFIX = "dta-learning:corrupt:";

const JSON_INDENT_SPACES = 2;

type ParseResult = { ok: true; file: SaveFile } | { ok: false; error: string };

function parseSaveFileText(text: string): ParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "The file is not valid JSON." };
  }
  const parsed = parseSaveFile(json);
  if (!parsed.ok) {
    return { ok: false, error: `The file is not a valid dta-learning save file:\n${parsed.error}` };
  }
  return parsed;
}

function resolveStorage(storage: Storage | undefined): Storage | undefined {
  if (storage !== undefined) {
    return storage;
  }
  try {
    return window.localStorage;
  } catch {
    // No window (tests, server) or storage blocked by the browser: work in memory.
    return undefined;
  }
}

function readStoredText(storage: Storage | undefined): string | null {
  try {
    return storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

function writeItem(storage: Storage | undefined, key: string, value: string): boolean {
  if (storage === undefined) {
    return false;
  }
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function backUpCorruptText(storage: Storage | undefined, text: string): void {
  const backupKey = `${CORRUPT_BACKUP_KEY_PREFIX}${new Date().toISOString()}`;
  if (!writeItem(storage, backupKey, text)) {
    console.error(`Could not back up invalid stored data to ${backupKey}.`);
  }
}

/**
 * Returns a Store over `storage` (default: window.localStorage). Invalid stored data is backed
 * up, never overwritten, and when storage is unavailable the store keeps working in memory.
 */
export function createLocalStore(storage?: Storage): Store {
  const backingStorage = resolveStorage(storage);
  // Holds the latest save only while it could not be persisted, so load never returns stale data.
  let unpersistedFile: SaveFile | undefined;

  return {
    load() {
      if (unpersistedFile !== undefined) {
        return unpersistedFile;
      }
      const storedText = readStoredText(backingStorage);
      if (storedText === null) {
        return EMPTY_SAVE_FILE;
      }
      const parsed = parseSaveFileText(storedText);
      if (!parsed.ok) {
        backUpCorruptText(backingStorage, storedText);
        return EMPTY_SAVE_FILE;
      }
      return parsed.file;
    },
    save(file) {
      const isPersisted = writeItem(backingStorage, STORAGE_KEY, JSON.stringify(file));
      unpersistedFile = isPersisted ? undefined : file;
    },
  };
}

/** Returns the save file as pretty-printed JSON, the format of the export file. */
export function exportJson(file: SaveFile): string {
  return JSON.stringify(file, null, JSON_INDENT_SPACES);
}

/**
 * Merges an exported file into `current` and returns the result with the number of entries added.
 * Current settings are kept, unless the current log is empty: then the imported settings are used.
 */
export function importJson(
  text: string,
  current: SaveFile,
): { ok: true; file: SaveFile; added: number } | { ok: false; error: string } {
  const parsed = parseSaveFileText(text);
  if (!parsed.ok) {
    return parsed;
  }
  const isCurrentLogEmpty = current.entries.length === 0;
  const entries = mergeEntries(current.entries, parsed.file.entries);
  const settings = isCurrentLogEmpty ? parsed.file.settings : current.settings;
  const added = entries.length - current.entries.length;
  return { ok: true, file: { ...current, entries, settings }, added };
}
