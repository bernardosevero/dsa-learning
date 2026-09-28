import { today } from "@/domain/dates";
import type { Attempt, Entry, SaveFile, Settings } from "@/domain/types";

/** What a screen supplies to log an attempt; the reducer adds the id. */
export type NewAttempt = Omit<Attempt, "id" | "type">;

/** Returns the file with the attempt appended under a new uuid. */
export function addAttempt(file: SaveFile, attempt: NewAttempt): SaveFile {
  const entry: Attempt = { ...attempt, id: crypto.randomUUID(), type: "attempt" };
  return { ...file, entries: [...file.entries, entry] };
}

/** Returns the file with a mark appended that makes the problem mastered from today. */
export function markMastered(file: SaveFile, problemId: string): SaveFile {
  const now = new Date();
  const mark: Entry = {
    type: "markedMastered",
    id: crypto.randomUUID(),
    problemId,
    at: now.toISOString(),
    date: today(now),
  };
  return { ...file, entries: [...file.entries, mark] };
}

// An entry already undone keeps its first deletion time.
function markDeleted(entry: Entry, deletedAt: string): Entry {
  return entry.deletedAt === undefined ? { ...entry, deletedAt } : entry;
}

/** Returns the file with the entry marked deleted now. Entries are never removed. */
export function deleteEntry(file: SaveFile, entryId: string): SaveFile {
  const deletedAt = new Date().toISOString();
  const entries = file.entries.map((entry) =>
    entry.id === entryId ? markDeleted(entry, deletedAt) : entry,
  );
  return { ...file, entries };
}

/** Returns the file with the given settings replaced and the rest kept. */
export function updateSettings(file: SaveFile, partial: Partial<Settings>): SaveFile {
  return { ...file, settings: { ...file.settings, ...partial } };
}

/**
 * Returns the file with a timer for the problem started now, replacing any other timer.
 * A timer already running for the same problem is kept, so reloading doesn't reset it.
 */
export function startTimer(file: SaveFile, problemId: string): SaveFile {
  if (file.activeTimer?.problemId === problemId) {
    return file;
  }
  return { ...file, activeTimer: { problemId, startedAt: new Date().toISOString() } };
}

/**
 * Returns the file with the problem's timer started over from now. Unlike `startTimer`, it
 * replaces a timer already running for the same problem: the user asked to drop that time.
 */
export function restartTimer(file: SaveFile, problemId: string): SaveFile {
  return { ...file, activeTimer: { problemId, startedAt: new Date().toISOString() } };
}

/** Returns the file without a running timer. */
export function clearTimer(file: SaveFile): SaveFile {
  const withoutTimer = { ...file };
  delete withoutTimer.activeTimer;
  return withoutTimer;
}

/**
 * Returns the file with an empty log and no timer, keeping the settings. Unlike undo, the entries
 * go, so importing an export made before the reset brings them back (a deleted copy would win).
 */
export function resetProgress(file: SaveFile): SaveFile {
  return clearTimer({ ...file, entries: [] });
}
