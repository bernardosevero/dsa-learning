import { daysBetween } from "./dates";
import { deriveState, sortByTimestamp } from "./schedule";
import type { Attempt, Entry, LocalDate, Rating } from "./types";

/** A review done at most this many days after its due date counts as on time. */
export const ON_TIME_GRACE_DAYS = 2;
const DAYS_PER_WEEK = 7;
const RATING_EASE: Record<Rating, number> = { hard: 0, medium: 1, easy: 2 };

export interface Metrics {
  onTimeReviews: { onTime: number; total: number; share: number | null };
  resolveSpeed: { firstAttemptMedianMinutes: number | null; reviewMedianMinutes: number | null };
  ratingProgress: { improved: number; total: number; share: number | null };
  load: { attempts: number; activeDays: number; attemptsPerActiveDay: number | null };
  habit: { activeDays: number; weeks: number; daysPerWeek: number | null };
}

/** One attempt with its place in the problem's history. `dueDate` is null when nothing was due. */
interface ReplayedAttempt {
  attempt: Attempt;
  isReview: boolean;
  dueDate: LocalDate | null;
}

/** Returns the median of the values, the mean of the middle two for an even count, or null. */
export function median(values: readonly number[]): number | null {
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const upper = sorted[middle];
  if (upper === undefined) {
    return null;
  }
  const lower = sorted[middle - 1];
  if (sorted.length % 2 === 0 && lower !== undefined) {
    return (lower + upper) / 2;
  }
  return upper;
}

function ratioOf(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

function groupByProblem(entries: readonly Entry[]): Map<string, Entry[]> {
  const entriesByProblem = new Map<string, Entry[]>();
  for (const entry of entries) {
    const problemEntries = entriesByProblem.get(entry.problemId) ?? [];
    problemEntries.push(entry);
    entriesByProblem.set(entry.problemId, problemEntries);
  }
  return entriesByProblem;
}

function dueDateBefore(earlierEntries: readonly Entry[]): LocalDate | null {
  const state = deriveState(earlierEntries);
  return state.status === "active" ? state.dueDate : null;
}

/** Replays one problem's sorted, non-deleted entries into its attempts with their due dates. */
function replayProblem(sortedEntries: readonly Entry[]): ReplayedAttempt[] {
  const replayed: ReplayedAttempt[] = [];
  for (const [index, entry] of sortedEntries.entries()) {
    if (entry.type !== "attempt") {
      continue;
    }
    const earlierEntries = sortedEntries.slice(0, index);
    replayed.push({
      attempt: entry,
      isReview: replayed.length > 0,
      dueDate: dueDateBefore(earlierEntries),
    });
  }
  return replayed;
}

function isOnTime(review: ReplayedAttempt): boolean {
  return (
    review.dueDate !== null &&
    daysBetween(review.dueDate, review.attempt.date) <= ON_TIME_GRACE_DAYS
  );
}

function onTimeReviewsOf(reviews: readonly ReplayedAttempt[]): Metrics["onTimeReviews"] {
  const scheduledReviews = reviews.filter((review) => review.dueDate !== null);
  const onTime = scheduledReviews.filter(isOnTime).length;
  return {
    onTime,
    total: scheduledReviews.length,
    share: ratioOf(onTime, scheduledReviews.length),
  };
}

function timeOf(replayed: ReplayedAttempt): number {
  return replayed.attempt.timeMinutes;
}

function resolveSpeedOf(problems: readonly ReplayedAttempt[][]): Metrics["resolveSpeed"] {
  const firstAttemptMinutes: number[] = [];
  const reviewMinutes: number[] = [];
  for (const [firstAttempt, ...reviews] of problems) {
    if (firstAttempt === undefined || reviews.length === 0) {
      continue;
    }
    firstAttemptMinutes.push(timeOf(firstAttempt));
    reviewMinutes.push(...reviews.map(timeOf));
  }
  return {
    firstAttemptMedianMinutes: median(firstAttemptMinutes),
    reviewMedianMinutes: median(reviewMinutes),
  };
}

function hasImproved(first: Attempt, latest: Attempt): boolean {
  return RATING_EASE[latest.rating] > RATING_EASE[first.rating];
}

function ratingProgressOf(problems: readonly ReplayedAttempt[][]): Metrics["ratingProgress"] {
  let improved = 0;
  let total = 0;
  for (const attempts of problems) {
    const first = attempts.at(0);
    const latest = attempts.at(-1);
    if (first === undefined || latest === undefined || attempts.length < 2) {
      continue;
    }
    total += 1;
    improved += hasImproved(first.attempt, latest.attempt) ? 1 : 0;
  }
  return { improved, total, share: ratioOf(improved, total) };
}

function habitOf(sortedActiveDays: readonly LocalDate[]): Metrics["habit"] {
  const firstDay = sortedActiveDays.at(0);
  const lastDay = sortedActiveDays.at(-1);
  if (firstDay === undefined || lastDay === undefined) {
    return { activeDays: 0, weeks: 0, daysPerWeek: null };
  }
  const spanDays = daysBetween(firstDay, lastDay) + 1;
  const weeks = Math.ceil(spanDays / DAYS_PER_WEEK);
  const activeDays = sortedActiveDays.length;
  return { activeDays, weeks, daysPerWeek: activeDays / weeks };
}

/**
 * Returns the dogfooding success metrics of a log, ignoring deleted entries. A review is any
 * attempt after a problem's first attempt; its due date comes from replaying the entries before it.
 */
export function computeMetrics(entries: readonly Entry[]): Metrics {
  const liveEntries = entries.filter((entry) => entry.deletedAt === undefined);
  const problems = [...groupByProblem(liveEntries).values()].map((problemEntries) =>
    replayProblem(sortByTimestamp(problemEntries)),
  );
  const allAttempts = problems.flat();
  const reviews = allAttempts.filter((replayed) => replayed.isReview);
  const activeDays = [...new Set(allAttempts.map((replayed) => replayed.attempt.date))].toSorted();

  return {
    onTimeReviews: onTimeReviewsOf(reviews),
    resolveSpeed: resolveSpeedOf(problems),
    ratingProgress: ratingProgressOf(problems),
    load: {
      attempts: allAttempts.length,
      activeDays: activeDays.length,
      attemptsPerActiveDay: ratioOf(allAttempts.length, activeDays.length),
    },
    habit: habitOf(activeDays),
  };
}
