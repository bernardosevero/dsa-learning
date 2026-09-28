import { findNextNew } from "./today";
import type { LocalDate, Problem, ProblemState } from "./types";

/** What the Problems screen badges: "active" split into due and not-yet-due. */
export type ProblemStatus = "new" | "scheduled" | "due" | "mastered";

export interface ProblemRow {
  problem: Problem;
  state: ProblemState;
  status: ProblemStatus;
  /** The next new problem Today offers. */
  isUpNext: boolean;
}

export interface TopicGroup {
  pattern: string;
  rows: ProblemRow[];
  // The counts always cover the whole topic, even when its rows are filtered.
  startedOrMastered: number;
  mastered: number;
  due: number;
  total: number;
}

export type ProblemFilter = "all" | "due" | "new" | "mastered";

// A problem with no derived state has no entries, so it is new.
const NEW_PROBLEM: ProblemState = { status: "new" };

/** Returns the problem's status on the given day: due means active with dueDate on or before it. */
export function statusOf(state: ProblemState, today: LocalDate): ProblemStatus {
  if (state.status !== "active") {
    return state.status;
  }
  return state.dueDate <= today ? "due" : "scheduled";
}

function countTopic(pattern: string, rows: ProblemRow[]): TopicGroup {
  const topic: TopicGroup = { pattern, rows, startedOrMastered: 0, mastered: 0, due: 0, total: 0 };
  for (const row of rows) {
    topic.total += 1;
    if (row.status !== "new") topic.startedOrMastered += 1;
    if (row.status === "mastered") topic.mastered += 1;
    if (row.status === "due") topic.due += 1;
  }
  return topic;
}

/** Returns every problem as a row with its status, grouped by pattern, both in NeetCode order. */
export function groupByTopic(
  problems: readonly Problem[],
  states: Readonly<Record<string, ProblemState>>,
  today: LocalDate,
): TopicGroup[] {
  const nextNew = findNextNew(problems, states);
  const rowsByPattern = new Map<string, ProblemRow[]>();
  for (const problem of problems.toSorted((a, b) => a.order - b.order)) {
    const state = states[problem.id] ?? NEW_PROBLEM;
    const row = { problem, state, status: statusOf(state, today), isUpNext: problem === nextNew };
    const rows = rowsByPattern.get(problem.pattern) ?? [];
    rows.push(row);
    rowsByPattern.set(problem.pattern, rows);
  }
  return [...rowsByPattern].map(([pattern, rows]) => countTopic(pattern, rows));
}

function isInProgress(topic: TopicGroup): boolean {
  return topic.startedOrMastered > 0 || topic.rows.some((row) => row.isUpNext);
}

/**
 * Returns the topics for Today's "Progress by topic": each with a started or mastered problem,
 * plus the next new problem's topic, in NeetCode order.
 */
export function listTopicsInProgress(topics: readonly TopicGroup[]): TopicGroup[] {
  return topics.filter(isInProgress);
}

function matchesFilter(row: ProblemRow, filter: ProblemFilter): boolean {
  return filter === "all" || row.status === filter;
}

/** Returns the topics with only the rows the filter keeps, dropping topics left empty. */
export function filterTopics(topics: readonly TopicGroup[], filter: ProblemFilter): TopicGroup[] {
  const filtered: TopicGroup[] = [];
  for (const topic of topics) {
    const rows = topic.rows.filter((row) => matchesFilter(row, filter));
    if (rows.length > 0) {
      filtered.push({ ...topic, rows });
    }
  }
  return filtered;
}

/** Returns how many problems have each status, across all topics. */
export function countByStatus(topics: readonly TopicGroup[]): Record<ProblemStatus, number> {
  const counts: Record<ProblemStatus, number> = { new: 0, scheduled: 0, due: 0, mastered: 0 };
  for (const topic of topics) {
    for (const row of topic.rows) {
      counts[row.status] += 1;
    }
  }
  return counts;
}
