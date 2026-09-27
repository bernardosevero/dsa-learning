/** "YYYY-MM-DD" in the user's time zone. String order equals date order. */
export type LocalDate = string;

/** LeetCode's official difficulty (not the user's rating). */
export type Difficulty = "Easy" | "Medium" | "Hard";
/** How hard the attempt felt to the user. Drives the schedule. */
export type Rating = "hard" | "medium" | "easy";
export type Help = "none" | "hint" | "solution";

export interface Problem {
  /** LeetCode slug, e.g. "contains-duplicate"; the stable key. */
  id: string;
  title: string;
  /** One line, in our own words. */
  summary: string;
  /** NeetCode topic, e.g. "Arrays & Hashing". */
  pattern: string;
  difficulty: Difficulty;
  /** Practice page, e.g. https://neetcode.io/problems/duplicate-integer */
  neetcodeUrl: string;
  /** Secondary link, e.g. https://leetcode.com/problems/contains-duplicate/ */
  leetcodeUrl: string;
  /** 1..150, NeetCode's order, topic by topic. */
  order: number;
  /** NeetCode YouTube explanation, shown only after an attempt. */
  videoId?: string;
  blind75?: boolean;
}

interface EntryBase {
  /** uuid; the merge key. */
  id: string;
  problemId: string;
  /** ISO timestamp. Set by undo; entries are never removed. */
  deletedAt?: string;
}

export interface Attempt extends EntryBase {
  type: "attempt";
  /** ISO timestamp, from the timer. */
  startedAt?: string;
  /** ISO timestamp. */
  completedAt: string;
  /** Local day of completion; used for scheduling. */
  date: LocalDate;
  rating: Rating;
  timeMinutes: number;
  help: Help;
  keyInsight?: string;
  notes?: string;
}

export interface MarkedMastered extends EntryBase {
  type: "markedMastered";
  /** ISO timestamp. */
  at: string;
  date: LocalDate;
}

export type Entry = Attempt | MarkedMastered;

export type ProblemState =
  | { status: "new" }
  | { status: "active"; lastRating: Rating; dueDate: LocalDate }
  | { status: "mastered"; since: LocalDate };

export interface Settings {
  timeBoxMinutes: Record<Difficulty, number>;
  showPatternOnReviews: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  timeBoxMinutes: { Easy: 15, Medium: 30, Hard: 45 },
  showPatternOnReviews: false,
};

/** What goes in localStorage and in the export file. */
export interface SaveFile {
  version: 1;
  entries: Entry[];
  settings: Settings;
  activeTimer?: { problemId: string; startedAt: string };
}

export const EMPTY_SAVE_FILE: SaveFile = { version: 1, entries: [], settings: DEFAULT_SETTINGS };

/** Timestamp that orders entries: completedAt for attempts, at for mastered marks. */
export function entryTimestamp(entry: Entry): string {
  return entry.type === "attempt" ? entry.completedAt : entry.at;
}
