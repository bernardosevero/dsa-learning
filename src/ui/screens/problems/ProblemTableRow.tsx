import { EllipsisIcon } from "lucide-react";
import { Link } from "react-router";

import type { ProblemRow } from "@/domain/problemList";
import type { Entry, LocalDate, Problem, ProblemState } from "@/domain/types";
import { Button } from "@/ui/primitives/button";
import { cn } from "@/ui/primitives/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/ui/primitives/dropdown-menu";
import { formatMonthDay } from "@/ui/shared/format";
import { RATING_STYLES } from "@/ui/shared/RatingChip";
import { StatusBadge } from "@/ui/shared/StatusBadge";
import { t } from "@/ui/shared/strings";

import { RowDetailLine } from "./RowDetailLine";

export interface ProblemTableRowProps {
  row: ProblemRow;
  /** The log, to tell a mastered problem's last rating from an Already mastered mark. */
  entries: readonly Entry[];
  todayDate: LocalDate;
  onMarkMastered: (problem: Problem) => void;
}

// Below 560px the columns can't fit, so the row becomes a grid: title and detail line on the left,
// the status cell beside the title, the menu on the right, and the rating and date cells hidden.
const NARROW_ROW = "max-[560px]:grid max-[560px]:grid-cols-[minmax(0,1fr)_auto_auto]";
const WIDE_ONLY_CELL = "hidden px-2 min-[560px]:table-cell";

/** One problem: title and difficulty, last rating, next due date, status and its actions menu. */
export function ProblemTableRow({ row, entries, todayDate, onMarkMastered }: ProblemTableRowProps) {
  const { problem, state, status } = row;
  const isDue = status === "due";

  function handleMarkMastered() {
    onMarkMastered(problem);
  }

  return (
    <tr className={cn("border-t", NARROW_ROW, isDue && "bg-accent")}>
      <td className="py-2 pr-2 pl-4">
        <Link
          to={`/problems/${problem.id}`}
          className={cn("block break-words hover:underline", isDue && "font-semibold")}
        >
          {problem.title}
        </Link>
        <RowDetailLine row={row} entries={entries} todayDate={todayDate} />
      </td>
      <td className={cn(WIDE_ONLY_CELL, "text-sm")}>
        <LastRating state={state} />
      </td>
      <td className={cn(WIDE_ONLY_CELL, "font-mono text-sm")}>{formatNext(state, todayDate)}</td>
      <td className="px-2 max-[560px]:self-start max-[560px]:pt-2.5">
        <StatusBadge status={status} />
      </td>
      <td className="pr-1 text-right max-[560px]:self-center">
        {/* Not modal, so the confirm dialog it opens gets focus and pointer events back. */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-11">
              <EllipsisIcon aria-hidden />
              <span className="sr-only">{t.problems.actionsFor(problem.title)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/solve/${problem.id}`}>{t.problems.startNow}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/problems/${problem.id}`}>{t.problems.openDetails}</Link>
            </DropdownMenuItem>
            {status !== "mastered" && (
              <DropdownMenuItem onSelect={handleMarkMastered}>
                {t.problems.markMastered}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// Only an active problem has a last rating and a next date that drive its schedule.
function formatNext(state: ProblemState, todayDate: LocalDate): string {
  if (state.status !== "active") {
    return t.problems.noValue;
  }
  return state.dueDate === todayDate ? t.problems.dueToday : formatMonthDay(state.dueDate);
}

interface LastRatingProps {
  state: ProblemState;
}

function LastRating({ state }: LastRatingProps) {
  if (state.status !== "active") {
    return <span className="text-muted-foreground">{t.problems.noValue}</span>;
  }
  const rating = state.lastRating;
  return <span className={cn("font-medium", RATING_STYLES[rating].text)}>{t.ratings[rating]}</span>;
}
