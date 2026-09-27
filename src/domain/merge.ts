import { entryTimestamp, type Entry } from "./types";

function compareByTimestampThenId(first: Entry, second: Entry): number {
  const firstTimestamp = entryTimestamp(first);
  const secondTimestamp = entryTimestamp(second);
  if (firstTimestamp !== secondTimestamp) {
    return firstTimestamp < secondTimestamp ? -1 : 1;
  }
  return first.id.localeCompare(second.id);
}

/** Picks the copy to keep when both logs hold the same id: a deletion wins, the earliest one first. */
function pickSurvivor(kept: Entry, other: Entry): Entry {
  if (other.deletedAt === undefined) {
    return kept;
  }
  if (kept.deletedAt === undefined || other.deletedAt < kept.deletedAt) {
    return other;
  }
  return kept;
}

/**
 * Returns the union of both logs by entry id, sorted by timestamp then id. When an id is on both
 * sides and either copy is deleted, the deleted copy with the earliest `deletedAt` wins.
 */
export function mergeEntries(current: readonly Entry[], incoming: readonly Entry[]): Entry[] {
  const entriesById = new Map<string, Entry>();
  for (const entry of [...current, ...incoming]) {
    const kept = entriesById.get(entry.id);
    entriesById.set(entry.id, kept === undefined ? entry : pickSurvivor(kept, entry));
  }
  return [...entriesById.values()].toSorted(compareByTimestampThenId);
}
