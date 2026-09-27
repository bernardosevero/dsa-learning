import type { LocalDate } from "./types";

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const GREGORIAN_CYCLE_YEARS = 400;
const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toUtcTimestamp(date: LocalDate): number {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));

  // Shift one Gregorian cycle so Date.UTC does not reinterpret years 00–99 as 1900–1999.
  return Date.UTC(year + GREGORIAN_CYCLE_YEARS, month - 1, day);
}

function fromUtcTimestamp(timestamp: number): LocalDate {
  const date = new Date(timestamp);
  const year = String(date.getUTCFullYear() - GREGORIAN_CYCLE_YEARS).padStart(4, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Returns the calendar day of an instant in the requested or runtime time zone. */
export function toLocalDate(instant: Date, timeZone?: string): LocalDate {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  let year = "";
  let month = "";
  let day = "";

  for (const part of formatter.formatToParts(instant)) {
    if (part.type === "year") year = part.value;
    if (part.type === "month") month = part.value;
    if (part.type === "day") day = part.value;
  }

  return `${year}-${month}-${day}`;
}

/** Returns today's LocalDate in the requested or runtime time zone. */
export function today(now: Date = new Date(), timeZone?: string): LocalDate {
  return toLocalDate(now, timeZone);
}

/** Adds calendar days in UTC, unaffected by the runtime time zone or daylight saving. */
export function addDays(date: LocalDate, days: number): LocalDate {
  return fromUtcTimestamp(toUtcTimestamp(date) + days * MILLISECONDS_PER_DAY);
}

/** Returns signed whole calendar days from `from` to `to`. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return (toUtcTimestamp(to) - toUtcTimestamp(from)) / MILLISECONDS_PER_DAY;
}

/** Returns whether a string is a real date in strict YYYY-MM-DD form. */
export function isValidLocalDate(value: string): boolean {
  if (!LOCAL_DATE_PATTERN.test(value)) {
    return false;
  }

  return fromUtcTimestamp(toUtcTimestamp(value)) === value;
}
