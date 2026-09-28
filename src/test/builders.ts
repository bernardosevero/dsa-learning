import {
  EMPTY_SAVE_FILE,
  type Attempt,
  type MarkedMastered,
  type Problem,
  type SaveFile,
} from "@/domain/types";

// The same shape as NewAttempt in ui/app, spelled out so domain tests never depend on ui.
type NewAttempt = Omit<Attempt, "id" | "type">;

const DEFAULT_PROBLEM_ID = "contains-duplicate";
const DEFAULT_DATE = "2026-10-01";
const DEFAULT_TIME_MINUTES = 20;

/** A Medium attempt on Contains Duplicate; completedAt follows `date` unless given. */
export function anAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    type: "attempt",
    id: "attempt-1",
    problemId: DEFAULT_PROBLEM_ID,
    completedAt: `${overrides.date ?? DEFAULT_DATE}T12:00:00.000Z`,
    date: DEFAULT_DATE,
    rating: "medium",
    timeMinutes: DEFAULT_TIME_MINUTES,
    help: "none",
    ...overrides,
  };
}

/** What a screen hands to addAttempt: an attempt without id and type. */
export function aNewAttempt(overrides: Partial<NewAttempt> = {}): NewAttempt {
  return {
    problemId: DEFAULT_PROBLEM_ID,
    completedAt: `${overrides.date ?? DEFAULT_DATE}T12:00:00.000Z`,
    date: DEFAULT_DATE,
    rating: "medium",
    timeMinutes: DEFAULT_TIME_MINUTES,
    help: "none",
    ...overrides,
  };
}

/** An "already mastered" mark on Contains Duplicate; `at` follows `date` unless given. */
export function aMasteredMark(overrides: Partial<MarkedMastered> = {}): MarkedMastered {
  return {
    type: "markedMastered",
    id: "mark-1",
    problemId: DEFAULT_PROBLEM_ID,
    at: `${overrides.date ?? DEFAULT_DATE}T13:00:00.000Z`,
    date: DEFAULT_DATE,
    ...overrides,
  };
}

/** An empty save file with default settings. */
export function aSaveFile(overrides: Partial<SaveFile> = {}): SaveFile {
  return { ...EMPTY_SAVE_FILE, ...overrides };
}

/** An Easy Arrays & Hashing problem; id and order are required because every list needs them. */
export function aProblem(overrides: Partial<Problem> & Pick<Problem, "id" | "order">): Problem {
  return {
    title: overrides.id,
    summary: "A one-line summary.",
    pattern: "Arrays & Hashing",
    difficulty: "Easy",
    neetcodeUrl: `https://neetcode.io/problems/${overrides.id}`,
    leetcodeUrl: `https://leetcode.com/problems/${overrides.id}/`,
    ...overrides,
  };
}
