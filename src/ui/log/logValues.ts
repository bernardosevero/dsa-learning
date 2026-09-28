import type { Attempt, Help, Rating } from "@/domain/types";
import { t } from "@/ui/strings";

/** The shortest and longest attempt the form accepts, in minutes. */
export const MIN_MINUTES = 1;
export const MAX_MINUTES = 600;
const MILLISECONDS_PER_MINUTE = 60_000;

/** The Log form as typed, before validation. */
export interface LogValues {
  rating: Rating | null;
  /** Kept as typed, so the field can be empty while editing. */
  timeText: string;
  help: Help;
  keyInsight: string;
  notes: string;
}

/** A log the user can save: rating chosen, time in range, free text trimmed. */
export interface ValidLog {
  rating: Rating;
  timeMinutes: number;
  help: Help;
  keyInsight: string;
  notes: string;
}

export interface LogErrors {
  rating?: string;
  time?: string;
}

/** Returns the first values of the form: help from `?help=`, and Hard when it's "solution". */
export function createInitialLogValues(
  helpParam: string | null,
  timerMinutes: number | null,
): LogValues {
  const help: Help = helpParam === "solution" ? "solution" : "none";
  return {
    rating: help === "solution" ? "hard" : null,
    timeText: timerMinutes === null ? "" : String(timerMinutes),
    help,
    keyInsight: "",
    notes: "",
  };
}

/** Returns the whole minutes since `startedAt`, rounded up and at least 1. */
export function countMinutesSince(startedAt: string, now: Date): number {
  const elapsed = now.getTime() - Date.parse(startedAt);
  return Math.max(MIN_MINUTES, Math.ceil(elapsed / MILLISECONDS_PER_MINUTE));
}

/** Returns the log ready to save, or the message for each field that blocks it. */
export function validateLog(
  values: LogValues,
): { ok: true; value: ValidLog } | { ok: false; errors: LogErrors } {
  const timeMinutes = Number(values.timeText);
  const isTimeValid =
    values.timeText.trim() !== "" &&
    Number.isInteger(timeMinutes) &&
    timeMinutes >= MIN_MINUTES &&
    timeMinutes <= MAX_MINUTES;
  if (values.rating === null || !isTimeValid) {
    const errors: LogErrors = {};
    if (values.rating === null) errors.rating = t.log.ratingRequired;
    if (!isTimeValid) errors.time = t.log.timeInvalid(MIN_MINUTES, MAX_MINUTES);
    return { ok: false, errors };
  }
  return {
    ok: true,
    value: {
      rating: values.rating,
      timeMinutes,
      help: values.help,
      keyInsight: values.keyInsight.trim(),
      notes: values.notes.trim(),
    },
  };
}

/** What the confirmation needs after a save: the log, when it was saved, and the attempt before. */
export interface SavedLog {
  log: ValidLog;
  completedAt: string;
  previous: Attempt | null;
}

/** Returns the form values that re-open a saved log, for Undo. */
export function toLogValues(log: ValidLog): LogValues {
  return { ...log, timeText: String(log.timeMinutes) };
}
