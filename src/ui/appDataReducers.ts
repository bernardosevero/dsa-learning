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

/** Returns the file with a timer for the problem started now, replacing any other timer. */
export function startTimer(file: SaveFile, problemId: string): SaveFile {
  return { ...file, activeTimer: { problemId, startedAt: new Date().toISOString() } };
}

/** Returns the file without a running timer. */
export function clearTimer(file: SaveFile): SaveFile {
  const withoutTimer = { ...file };
  delete withoutTimer.activeTimer;
  return withoutTimer;
}

/** Returns the file with every entry marked deleted and no timer, so an import can bring it back. */
export function resetProgress(file: SaveFile): SaveFile {
  const deletedAt = new Date().toISOString();
  const entries = file.entries.map((entry) => markDeleted(entry, deletedAt));
  return clearTimer({ ...file, entries });
}
