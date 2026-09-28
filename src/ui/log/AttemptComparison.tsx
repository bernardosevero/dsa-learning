import type { Attempt, Help, Rating } from "@/domain/types";
import { RatingChip } from "@/ui/components/RatingChip";
import { formatMonthDay } from "@/ui/format";
import { t } from "@/ui/strings";

import type { ValidLog } from "./logForm";

function describeRating(rating: Rating, help: Help): string {
  const word = t.ratings[rating];
  return help === "none" ? word : `${word}${t.separator}${t.log.helps[help]}`;
}

function describeDifference(todayMinutes: number, lastMinutes: number): string {
  const difference = todayMinutes - lastMinutes;
  if (difference === 0) return t.log.sameTime;
  return difference < 0 ? t.log.faster(-difference) : t.log.slower(difference);
}

export interface AttemptComparisonProps {
  previous: Attempt;
  today: ValidLog;
}

/** Last time next to today: time, how it felt with the help used, and the time difference. */
export function AttemptComparison({ previous, today }: AttemptComparisonProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col items-start gap-1.5">
        <p className="text-xs text-muted-foreground">
          {t.log.lastTime(formatMonthDay(previous.date))}
        </p>
        <p className="font-mono text-xl">{t.log.minutes(previous.timeMinutes)}</p>
        <RatingChip
          rating={previous.rating}
          label={describeRating(previous.rating, previous.help)}
        />
      </div>
      <div className="flex flex-col items-start gap-1.5">
        <p className="text-xs text-muted-foreground">{t.log.todayColumn}</p>
        <p className="font-mono text-xl">{t.log.minutes(today.timeMinutes)}</p>
        <RatingChip rating={today.rating} label={describeRating(today.rating, today.help)} />
        <p className="text-sm text-primary">
          {describeDifference(today.timeMinutes, previous.timeMinutes)}
        </p>
      </div>
    </div>
  );
}
