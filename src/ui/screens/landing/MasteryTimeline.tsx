import { CircleCheckIcon } from "lucide-react";
import { Link } from "react-router";

import { addDays } from "@/domain/dates";
import { INTERVAL_DAYS } from "@/domain/schedule";
import type { LocalDate, Rating } from "@/domain/types";
import { Badge } from "@/ui/primitives/badge";
import { cn } from "@/ui/primitives/cn";
import { formatMonthDay } from "@/ui/shared/format";
import { RatingChip } from "@/ui/shared/RatingChip";
import { t } from "@/ui/shared/strings";

const { timeline } = t.landing;

// Any day works; the stops after it are computed from the real intervals.
const FIRST_SOLVE: LocalDate = "2026-10-01";

interface TimelineStop {
  date: LocalDate;
  label: string;
  rating: Rating;
  note: string;
}

/** Hard, then Medium, then Easy twice on time: each next date is the last one plus its interval. */
function buildStops(): TimelineStop[] {
  const secondDate = addDays(FIRST_SOLVE, INTERVAL_DAYS.hard);
  const thirdDate = addDays(secondDate, INTERVAL_DAYS.medium);
  const fourthDate = addDays(thirdDate, INTERVAL_DAYS.easy);
  return [
    {
      date: FIRST_SOLVE,
      label: timeline.firstSolve,
      rating: "hard",
      note: timeline.backIn(INTERVAL_DAYS.hard),
    },
    {
      date: secondDate,
      label: timeline.review,
      rating: "medium",
      note: timeline.backIn(INTERVAL_DAYS.medium),
    },
    {
      date: thirdDate,
      label: timeline.review,
      rating: "easy",
      note: timeline.backIn(INTERVAL_DAYS.easy),
    },
    {
      date: fourthDate,
      label: timeline.reviewOnTime,
      rating: "easy",
      note: timeline.easyAfterEasy,
    },
  ];
}

const STOP_CLASS = "flex flex-col gap-2 border-t-2 pt-3.5 pr-2 pb-4.5";

/** One problem's path from first solve to mastered, as an ordered list of dated stops. */
export function MasteryTimeline() {
  return (
    <div className="flex flex-col gap-3.5">
      <h3 className="text-[15px] font-semibold">{timeline.title}</h3>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-3">
        {buildStops().map((stop) => (
          <li key={stop.date} className={cn(STOP_CLASS, "border-foreground")}>
            <span className="font-mono text-[13px] text-muted-foreground">
              {formatMonthDay(stop.date)}
            </span>
            <span className="font-semibold">{stop.label}</span>
            <RatingChip rating={stop.rating} label={t.ratings[stop.rating]} />
            <span className="text-sm text-muted-foreground">{stop.note}</span>
          </li>
        ))}
        <li className={cn(STOP_CLASS, "border-dashed border-status-mastered")}>
          <span className="font-mono text-[13px] text-muted-foreground">
            {timeline.mastered.date}
          </span>
          <span className="font-semibold">{timeline.mastered.label}</span>
          <Badge variant="mastered">
            <CircleCheckIcon aria-hidden />
            {t.problems.statuses.mastered}
          </Badge>
          <span className="text-sm text-muted-foreground">{timeline.mastered.note}</span>
        </li>
      </ol>
      <Link
        to="/how-it-works#how-mastery"
        className="inline-flex min-h-11 items-center self-start font-medium text-primary underline"
      >
        {t.landing.intervalsMore}
      </Link>
    </div>
  );
}
