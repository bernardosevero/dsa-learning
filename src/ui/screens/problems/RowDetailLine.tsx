import type { ReactNode } from "react";

import { daysBetween } from "@/domain/dates";
import type { ProblemRow } from "@/domain/problemList";
import { isMarkedMastered, lastAttempt } from "@/domain/schedule";
import type { Entry, LocalDate, ProblemState, Rating } from "@/domain/types";
import { cn } from "@/ui/primitives/cn";
import { formatMonthDay } from "@/ui/shared/format";
import { RATING_STYLES } from "@/ui/shared/RatingChip";
import { t } from "@/ui/shared/strings";

// The parts the columns carry from 560px up, so the line only shows them on narrow windows.
const NARROW_ONLY = "min-[560px]:hidden";

// The rating that set the schedule: an active problem's last one, or the Easy that mastered it.
function feltRating(row: ProblemRow, entries: readonly Entry[]): Rating | undefined {
  if (row.state.status === "active") {
    return row.state.lastRating;
  }
  if (row.state.status === "mastered") {
    return lastAttempt(entries, row.problem.id)?.rating;
  }
  return undefined;
}

// "3 days overdue", "due today" or "next Sep 29"; null when nothing is scheduled.
function describeDue(state: ProblemState, todayDate: LocalDate): ReactNode {
  if (state.status !== "active") {
    return null;
  }
  const daysLate = daysBetween(state.dueDate, todayDate);
  if (daysLate > 0) {
    return t.today.daysOverdue(daysLate);
  }
  if (daysLate === 0) {
    return t.problems.detail.dueToday;
  }
  return (
    <>
      <span className="whitespace-nowrap">
        {t.problems.detail.next} <span className="font-mono">{formatMonthDay(state.dueDate)}</span>
      </span>
    </>
  );
}

export interface RowDetailLineProps {
  row: ProblemRow;
  entries: readonly Entry[];
  todayDate: LocalDate;
}

/**
 * The line under the title. From 560px it's just the difficulty (and "up next"), since the
 * columns carry the rest; below it, it also gives the rating and the date the columns would.
 */
export function RowDetailLine({ row, entries, todayDate }: RowDetailLineProps) {
  const { problem, state, isUpNext } = row;
  const isMarked = state.status === "mastered" && isMarkedMastered(entries, problem.id);
  const rating = isMarked ? undefined : feltRating(row, entries);
  const due = describeDue(state, todayDate);

  return (
    <p className="text-xs text-muted-foreground max-[560px]:text-sm">
      {problem.difficulty}
      {isUpNext && `${t.separator}${t.problems.upNext}`}
      {isMarked && (
        <span className={NARROW_ONLY}>
          {t.separator}
          {t.problems.detail.markedMastered}
        </span>
      )}
      {rating !== undefined && (
        <span className={NARROW_ONLY}>
          {t.separator}
          {t.problems.detail.felt}{" "}
          <span className={cn("font-semibold", RATING_STYLES[rating].text)}>
            {t.ratings[rating]}
          </span>
        </span>
      )}
      {due !== null && (
        <span className={NARROW_ONLY}>
          {t.separator}
          {due}
        </span>
      )}
    </p>
  );
}
