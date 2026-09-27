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

/** Formats a time estimate as "~45m", "~2h" or "~1h 50m". */
export function formatEstimate(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  if (hours === 0) {
    return `~${minutes}m`;
  }
  return minutes === 0 ? `~${hours}h` : `~${hours}h ${minutes}m`;
}
