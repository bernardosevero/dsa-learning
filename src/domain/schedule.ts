import { addDays } from "./dates";
import {
  entryTimestamp,
  type Attempt,
  type Entry,
  type LocalDate,
  type ProblemState,
  type Rating,
} from "./types";

export const INTERVAL_DAYS = { hard: 2, medium: 7, easy: 30 } as const satisfies Record<
  Rating,
  number
>;

const NEW_PROBLEM: ProblemState = { status: "new" };

function withoutDeleted(entries: readonly Entry[]): Entry[] {
  return entries.filter((entry) => entry.deletedAt === undefined);
}

function compareByTimestamp(first: Entry, second: Entry): number {
  const firstTimestamp = entryTimestamp(first);
  const secondTimestamp = entryTimestamp(second);
  if (firstTimestamp !== secondTimestamp) {
    return firstTimestamp < secondTimestamp ? -1 : 1;
  }
  return first.id.localeCompare(second.id);
}

/** Returns a copy of the entries in replay order: timestamp, then id. */
export function sortByTimestamp(entries: readonly Entry[]): Entry[] {
  return entries.toSorted(compareByTimestamp);
}

function applyEntry(state: ProblemState, entry: Entry): ProblemState {
  if (entry.type === "markedMastered") {
    return { status: "mastered", since: entry.date };
  }
  return applyAttempt(state, entry);
}

function applyAttempt(state: ProblemState, attempt: Attempt): ProblemState {
  if (state.status === "mastered" && attempt.rating === "easy") {
    return state;
  }
  if (isSecondEasyOnReview(state, attempt)) {
    return { status: "mastered", since: attempt.date };
  }
  const intervalDays = INTERVAL_DAYS[attempt.rating];
  return {
    status: "active",
    lastRating: attempt.rating,
    dueDate: addDays(attempt.date, intervalDays),
  };
}

function isSecondEasyOnReview(state: ProblemState, attempt: Attempt): boolean {
  const isPreviousRatingEasy = state.status === "active" && state.lastRating === "easy";
  const isOnTimeOrLate = state.status === "active" && attempt.date >= state.dueDate;
  return isPreviousRatingEasy && isOnTimeOrLate && attempt.rating === "easy";
}

/** Replays one problem's non-deleted entries in timestamp and id order into its state. */
export function deriveState(entries: readonly Entry[]): ProblemState {
  let state = NEW_PROBLEM;
  for (const entry of sortByTimestamp(withoutDeleted(entries))) {
    state = applyEntry(state, entry);
  }
  return state;
}

/** Returns the derived state of every requested problem, including those with no entries. */
export function deriveAllStates(
  problemIds: readonly string[],
  entries: readonly Entry[],
): Record<string, ProblemState> {
  const states: Record<string, ProblemState> = {};
  for (const problemId of problemIds) {
    states[problemId] = deriveState(entries.filter((entry) => entry.problemId === problemId));
  }
  return states;
}

/** Returns the earliest due date among active problems, or null if none are active. */
export function earliestDueDate(states: Readonly<Record<string, ProblemState>>): LocalDate | null {
  let earliest: LocalDate | null = null;
  for (const state of Object.values(states)) {
    if (state.status === "active" && (earliest === null || state.dueDate < earliest)) {
      earliest = state.dueDate;
    }
  }
  return earliest;
}

/** Returns the latest non-deleted attempt for a problem, ignoring mastered marks. */
export function lastAttempt(entries: readonly Entry[], problemId: string): Attempt | undefined {
  let latest: Attempt | undefined;
  for (const entry of sortByTimestamp(withoutDeleted(entries))) {
    if (entry.type === "attempt" && entry.problemId === problemId) {
      latest = entry;
    }
  }
  return latest;
}
