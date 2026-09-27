import type { Attempt, Entry, LocalDate, SaveFile, Settings } from "@/domain/types";

/** What a screen supplies to log an attempt; the provider adds the id. */
export type NewAttempt = Omit<Attempt, "id" | "type">;

/** Returns the file with one attempt appended under `id`. */
export function addAttempt(file: SaveFile, attempt: NewAttempt, id: string): SaveFile {
  const entry: Attempt = { ...attempt, id, type: "attempt" };
  return { ...file, entries: [...file.entries, entry] };
}

/** Returns the file with a mark appended that makes the problem mastered from `date`. */
export function markMastered(
  file: SaveFile,
  mark: { id: string; problemId: string; at: string; date: LocalDate },
): SaveFile {
  return { ...file, entries: [...file.entries, { ...mark, type: "markedMastered" }] };
}

function withDeletedAt(entry: Entry, deletedAt: string): Entry {
  // An entry already undone keeps its first deletion time.
  return entry.deletedAt === undefined ? { ...entry, deletedAt } : entry;
}

/** Returns the file with the entry marked deleted at `deletedAt`. Entries are never removed. */
export function deleteEntry(file: SaveFile, entryId: string, deletedAt: string): SaveFile {
  const entries = file.entries.map((entry) =>
    entry.id === entryId ? withDeletedAt(entry, deletedAt) : entry,
  );
  return { ...file, entries };
}

/** Returns the file with the given settings replaced and the rest kept. */
export function updateSettings(file: SaveFile, partial: Partial<Settings>): SaveFile {
  return { ...file, settings: { ...file.settings, ...partial } };
}

/** Returns the file with a running timer for `problemId`, replacing any other timer. */
export function startTimer(file: SaveFile, problemId: string, startedAt: string): SaveFile {
  return { ...file, activeTimer: { problemId, startedAt } };
}

/** Returns the file without a running timer. */
export function clearTimer(file: SaveFile): SaveFile {
  const withoutTimer = { ...file };
  delete withoutTimer.activeTimer;
  return withoutTimer;
}

/** Returns the file with every entry marked deleted and no timer, so an import can bring it back. */
export function resetProgress(file: SaveFile, deletedAt: string): SaveFile {
  const entries = file.entries.map((entry) => withDeletedAt(entry, deletedAt));
  return clearTimer({ ...file, entries });
}
