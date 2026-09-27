import { daysBetween } from "./dates";
import { earliestDueDate, INTERVAL_DAYS, lastAttempt } from "./schedule";
import type { Entry, LocalDate, Problem, ProblemState, Rating, Settings } from "./types";

export interface DueReview {
  problem: Problem;
  dueDate: LocalDate;
  daysOverdue: number;
  lastRating: Rating;
  risk: number;
}

export type TodayView =
  // nextDue null = nothing active (e.g. everything mastered)
  | { kind: "caught-up"; nextDue: LocalDate | null }
  | {
      kind: "list";
      // Sorted; reviews[0] is the focus.
      reviews: DueReview[];
      estimateMinutes: number;
      nextNew: Problem | null;
      // Progress in nextNew's pattern: done = problems in it whose status is not "new".
      newTopic: { pattern: string; done: number; total: number } | null;
    };

interface TodayInput {
  problems: readonly Problem[];
  states: Readonly<Record<string, ProblemState>>;
  entries: readonly Entry[];
  settings: Settings;
  today: LocalDate;
}

type States = Readonly<Record<string, ProblemState>>;

const RATING_SEVERITY: Record<Rating, number> = { hard: 2, medium: 1, easy: 0 };

// A problem with no derived state has no entries, so it is new.
const NEW_PROBLEM: ProblemState = { status: "new" };

/** Most at risk first; then Hard before Medium before Easy; then NeetCode's order. */
function compareByForgettingRisk(a: DueReview, b: DueReview): number {
  if (a.risk !== b.risk) {
    return b.risk - a.risk;
  }
  if (a.lastRating !== b.lastRating) {
    return RATING_SEVERITY[b.lastRating] - RATING_SEVERITY[a.lastRating];
  }
  return a.problem.order - b.problem.order;
}

function stateOf(states: States, problemId: string): ProblemState {
  return states[problemId] ?? NEW_PROBLEM;
}

function isNewProblem(states: States, problem: Problem): boolean {
  return stateOf(states, problem.id).status === "new";
}

function isDue(state: ProblemState, today: LocalDate): boolean {
  return state.status === "active" && state.dueDate <= today;
}

function toDueReview(problem: Problem, state: ProblemState, today: LocalDate): DueReview | null {
  if (state.status !== "active" || !isDue(state, today)) {
    return null;
  }
  const daysOverdue = daysBetween(state.dueDate, today);
  return {
    problem,
    dueDate: state.dueDate,
    daysOverdue,
    lastRating: state.lastRating,
    risk: daysOverdue / INTERVAL_DAYS[state.lastRating],
  };
}

function collectDueReviews(
  problems: readonly Problem[],
  states: States,
  today: LocalDate,
): DueReview[] {
  const dueReviews: DueReview[] = [];
  for (const problem of problems) {
    const review = toDueReview(problem, stateOf(states, problem.id), today);
    if (review !== null) {
      dueReviews.push(review);
    }
  }
  return dueReviews.toSorted(compareByForgettingRisk);
}

function findNextNew(problems: readonly Problem[], states: States): Problem | null {
  let nextNew: Problem | null = null;
  for (const problem of problems) {
    if (isNewProblem(states, problem) && (nextNew === null || problem.order < nextNew.order)) {
      nextNew = problem;
    }
  }
  return nextNew;
}

function estimateReviewMinutes(
  reviews: readonly DueReview[],
  entries: readonly Entry[],
  settings: Settings,
): number {
  let totalMinutes = 0;
  for (const review of reviews) {
    const attempt = lastAttempt(entries, review.problem.id);
    totalMinutes += attempt?.timeMinutes ?? settings.timeBoxMinutes[review.problem.difficulty];
  }
  return totalMinutes;
}

function summarizeTopic(
  pattern: string,
  problems: readonly Problem[],
  states: States,
): { pattern: string; done: number; total: number } {
  const problemsInPattern = problems.filter((problem) => problem.pattern === pattern);
  const doneProblems = problemsInPattern.filter((problem) => !isNewProblem(states, problem));
  return { pattern, done: doneProblems.length, total: problemsInPattern.length };
}

/**
 * The Today list: due reviews sorted by forgetting risk (the first is the focus),
 * the next new problem, and the time estimate.
 */
export function buildToday(input: TodayInput): TodayView {
  const { problems, states, entries, settings, today } = input;
  const reviews = collectDueReviews(problems, states, today);
  const nextNew = findNextNew(problems, states);

  if (reviews.length === 0 && nextNew === null) {
    return { kind: "caught-up", nextDue: earliestDueDate(states) };
  }
  return {
    kind: "list",
    reviews,
    estimateMinutes: estimateReviewMinutes(reviews, entries, settings),
    nextNew,
    newTopic: nextNew === null ? null : summarizeTopic(nextNew.pattern, problems, states),
  };
}

/** Counters for the Today header. */
export function countStatuses(
  problems: readonly Problem[],
  states: States,
  today: LocalDate,
): { due: number; newLeft: number; mastered: number } {
  const counts = { due: 0, newLeft: 0, mastered: 0 };
  for (const problem of problems) {
    const state = stateOf(states, problem.id);
    if (state.status === "new") counts.newLeft += 1;
    if (state.status === "mastered") counts.mastered += 1;
    if (isDue(state, today)) counts.due += 1;
  }
  return counts;
}
