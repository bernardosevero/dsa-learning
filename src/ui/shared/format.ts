import type { LocalDate } from "@/domain/types";

const MINUTES_PER_HOUR = 60;

// LocalDate has no time zone, so it's read and printed in UTC to keep the same calendar day.
const SHORT_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Formats a day as "Thu, Oct 8". */
export function formatDate(date: LocalDate): string {
  return SHORT_DATE_FORMAT.format(new Date(`${date}T00:00:00Z`));
}

const SECONDS_PER_MINUTE = 60;
const MILLISECONDS_PER_SECOND = 1000;

const MONTH_DAY_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Formats a day as "Sep 24". */
export function formatMonthDay(date: LocalDate): string {
  return MONTH_DAY_FORMAT.format(new Date(`${date}T00:00:00Z`));
}

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

/** Formats a duration as a clock: "04:05", or "1:02:03" from an hour on. */
export function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / MILLISECONDS_PER_SECOND));
  const hours = Math.floor(totalSeconds / (SECONDS_PER_MINUTE * MINUTES_PER_HOUR));
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE) % MINUTES_PER_HOUR;
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  if (hours === 0) {
    return `${padTwo(minutes)}:${padTwo(seconds)}`;
  }
  return `${hours}:${padTwo(minutes)}:${padTwo(seconds)}`;
}

const MILLISECONDS_PER_MINUTE = SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;
const HOURS_PER_DAY = 24;

/** Formats how long ago an ISO time was: "just now", "2 min ago", "3 h ago" or "2 days ago". */
export function formatTimeAgo(isoTime: string, now: Date): string {
  const minutes = Math.floor((now.getTime() - Date.parse(isoTime)) / MILLISECONDS_PER_MINUTE);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) {
    return `${hours} h ago`;
  }
  const days = Math.floor(hours / HOURS_PER_DAY);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

/** Formats a time estimate as "~45m", "~2h" or "~1h 50m". */
export function formatEstimate(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  if (hours === 0) {
    return `~${minutes}m`;
  }
  return minutes === 0 ? `~${hours}h` : `~${hours}h ${minutes}m`;
}
