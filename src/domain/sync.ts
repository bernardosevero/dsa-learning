import { mergeEntries } from "./merge";
import type { Entry, SaveFile, Settings } from "./types";

/** The account's copy of the log and settings, as read from the saves row. */
export interface RemoteSave {
  entries: Entry[];
  settings: Settings;
  version: number;
}

export interface ReconcileResult {
  /** The local file to keep: merged entries, chosen settings, the local timer untouched. */
  file: SaveFile;
  /** What to write to the row; undefined when the row already holds exactly this. */
  toWrite?: { entries: Entry[]; settings: Settings };
}

function isPlainObject(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Keys holding undefined are left out, as JSON (and so the row) leaves them out.
function definedKeys(record: Readonly<Record<string, unknown>>): string[] {
  return Object.keys(record).filter((key) => record[key] !== undefined);
}

function areArraysEqual(first: readonly unknown[], second: readonly unknown[]): boolean {
  return (
    first.length === second.length &&
    first.every((item, index) => isStructurallyEqual(item, second[index]))
  );
}

function areObjectsEqual(
  first: Readonly<Record<string, unknown>>,
  second: Readonly<Record<string, unknown>>,
): boolean {
  const firstKeys = definedKeys(first);
  return (
    firstKeys.length === definedKeys(second).length &&
    firstKeys.every((key) => isStructurallyEqual(first[key], second[key]))
  );
}

/** Compares JSON-like values by content; object key order doesn't matter, as in Postgres jsonb. */
function isStructurallyEqual(first: unknown, second: unknown): boolean {
  if (Array.isArray(first) && Array.isArray(second)) {
    return areArraysEqual(first, second);
  }
  if (isPlainObject(first) && isPlainObject(second)) {
    return areObjectsEqual(first, second);
  }
  return first === second;
}

// Three-way: a change made on this device since the last sync wins, otherwise the account's copy.
function chooseSettings(
  local: Settings,
  remote: Settings,
  lastSyncedSettings: Settings | undefined,
): Settings {
  const isChangedHere =
    lastSyncedSettings !== undefined && !isStructurallyEqual(local, lastSyncedSettings);
  return isChangedHere ? local : remote;
}

/**
 * Returns the local file merged with the account's copy and what (if anything) to write back.
 * `remote` is undefined before the account's first sync. Entries merge with `mergeEntries`;
 * settings changed here since the last sync win; the running timer never syncs.
 */
export function reconcile(
  local: SaveFile,
  remote: RemoteSave | undefined,
  lastSyncedSettings: Settings | undefined,
): ReconcileResult {
  if (remote === undefined) {
    return { file: local, toWrite: { entries: local.entries, settings: local.settings } };
  }
  const entries = mergeEntries(local.entries, remote.entries);
  const settings = chooseSettings(local.settings, remote.settings, lastSyncedSettings);
  const isLocalCurrent =
    isStructurallyEqual(entries, local.entries) && isStructurallyEqual(settings, local.settings);
  // The same object when nothing came in, so a quiet sync doesn't re-render or re-save.
  const file = isLocalCurrent ? local : { ...local, entries, settings };
  const isRowCurrent =
    isStructurallyEqual(entries, remote.entries) && isStructurallyEqual(settings, remote.settings);
  return isRowCurrent ? { file } : { file, toWrite: { entries, settings } };
}
