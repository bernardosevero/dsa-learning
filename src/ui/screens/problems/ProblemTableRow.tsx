import { EllipsisIcon } from "lucide-react";
import { Link } from "react-router";

import type { ProblemRow } from "@/domain/problemList";
import type { LocalDate, Problem, ProblemState } from "@/domain/types";
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
import { t } from "@/ui/shared/strings";

import { StatusBadge } from "./StatusBadge";

export interface ProblemTableRowProps {
  row: ProblemRow;
  todayDate: LocalDate;
  onMarkMastered: (problem: Problem) => void;
}

/** One problem: title and difficulty, last rating, next due date, status and its actions menu. */
export function ProblemTableRow({ row, todayDate, onMarkMastered }: ProblemTableRowProps) {
  const { problem, state, status, isUpNext } = row;
  const isDue = status === "due";

  function handleMarkMastered() {
    onMarkMastered(problem);
  }

  return (
    <tr className={cn("border-t", isDue && "bg-accent")}>
      <td className="py-2 pr-2 pl-4">
        <Link
          to={`/problems/${problem.id}`}
          className={cn("block truncate hover:underline", isDue && "font-semibold")}
        >
          {problem.title}
        </Link>
        <span className="text-xs text-muted-foreground">
          {problem.difficulty}
          {isUpNext && `${t.separator}${t.problems.upNext}`}
        </span>
      </td>
      <td className="hidden px-2 text-sm sm:table-cell">
        <LastRating state={state} />
      </td>
      <td className="px-2 font-mono text-sm">{formatNext(state, todayDate)}</td>
      <td className="px-2">
        <StatusBadge status={status} />
      </td>
      <td className="pr-2 text-right">
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
