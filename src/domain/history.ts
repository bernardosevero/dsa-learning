import { sortByTimestamp } from "./schedule";
import type { Attempt, Entry } from "./types";

/** Returns a problem's entries newest first, without deleted ones: what its history shows. */
export function problemHistory(entries: readonly Entry[], problemId: string): Entry[] {
  const ownEntries = entries.filter(
    (entry) => entry.problemId === problemId && entry.deletedAt === undefined,
  );
  return sortByTimestamp(ownEntries).toReversed();
}

function isAttempt(entry: Entry): entry is Attempt {
  return entry.type === "attempt";
}

/**
 * Returns the first and the latest attempt's minutes from a newest-first history,
 * or null with fewer than two attempts.
 */
export function timeTrend(
  history: readonly Entry[],
): { firstMinutes: number; latestMinutes: number } | null {
  const attempts = history.filter(isAttempt);
  const latest = attempts[0];
  const first = attempts.at(-1);
  if (attempts.length < 2 || latest === undefined || first === undefined) {
    return null;
  }
  return { firstMinutes: first.timeMinutes, latestMinutes: latest.timeMinutes };
}
