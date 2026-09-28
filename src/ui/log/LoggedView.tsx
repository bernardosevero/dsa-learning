import { CircleCheckBigIcon, EyeIcon } from "lucide-react";
import { Link } from "react-router";

import { daysBetween } from "@/domain/dates";
import type { Attempt, Help, Problem, Rating } from "@/domain/types";
import { useAppData } from "@/ui/AppData";
import { ExternalLink } from "@/ui/components/ExternalLink";
import { FocusFrame } from "@/ui/components/FocusFrame";
import { Overline } from "@/ui/components/Overline";
import { RatingChip } from "@/ui/components/RatingChip";
import { Button, buttonVariants } from "@/ui/components/ui/button";
import { Card } from "@/ui/components/ui/card";
import { formatDate, formatMonthDay } from "@/ui/format";
import { cn } from "@/ui/lib/utils";
import { t } from "@/ui/strings";

import type { SavedLog, ValidLog } from "./logValues";

const LINK_CLASSES = cn(buttonVariants({ variant: "link" }), "gap-1 px-0");

function describeRating(rating: Rating, help: Help): string {
  const word = t.ratings[rating];
  return help === "none" ? word : `${word}${t.separator}${t.log.helps[help]}`;
}

function describeDifference(todayMinutes: number, lastMinutes: number): string {
  const difference = todayMinutes - lastMinutes;
  if (difference === 0) {
    return t.log.sameTime;
  }
  return difference < 0 ? t.log.faster(-difference) : t.log.slower(difference);
}

export interface LoggedViewProps {
  problem: Problem;
  saved: SavedLog;
  onUndo: () => void;
}

/** The confirmation after saving: what the schedule does next, then the reveal. */
export function LoggedView({ problem, saved, onUndo }: LoggedViewProps) {
  const { problems, states, todayDate } = useAppData();
  const state = states[problem.id];
  const masteredCount = Object.values(states).filter((each) => each.status === "mastered").length;
  const { rating } = saved.log;

  return (
    <FocusFrame>
      <title>{t.documentTitle(`${t.pages.logAttempt} ${problem.title}`)}</title>
      <div className="flex flex-col items-start gap-2">
        <RatingChip rating={rating} label={t.log.logged(t.ratings[rating])} />
        <h1 className="font-serif text-3xl font-semibold">{problem.title}</h1>
      </div>

      {state?.status === "active" && (
        <Card className="gap-1 p-5">
          <Overline>{t.log.nextResolve(state.dueDate)}</Overline>
          <p className="font-mono text-3xl">{formatDate(state.dueDate)}</p>
          <p className="font-mono text-sm text-muted-foreground">
            {t.today.inDays(daysBetween(todayDate, state.dueDate))}
          </p>
        </Card>
      )}

      {/* Mastered is quiet on purpose: no animation. */}
      {state?.status === "mastered" && (
        <Card className="items-center gap-3 p-6 text-center">
          <span className="rounded-full border-2 border-status-mastered p-1.5">
            <CircleCheckBigIcon aria-hidden className="size-8 text-status-mastered" />
          </span>
          <Overline className="text-sm text-status-mastered">{t.log.mastered}</Overline>
          <p className="text-muted-foreground">{t.log.masteredDetail}</p>
          <p className="font-mono text-sm">{t.log.masteredCount(masteredCount, problems.length)}</p>
        </Card>
      )}

      <NowRevealed problem={problem} today={saved.log} previous={saved.previous} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="flex-1">
          <Link to="/">{t.log.backToToday}</Link>
        </Button>
        <Button type="button" variant="outline" onClick={onUndo}>
          {t.log.undo}
        </Button>
      </div>
    </FocusFrame>
  );
}

interface NowRevealedProps {
  problem: Problem;
  today: ValidLog;
  previous: Attempt | null;
}

/** Everything the spoiler rule hid until now: the pattern, earlier insights, solution and video. */
function NowRevealed({ problem, today, previous }: NowRevealedProps) {
  return (
    <Card role="region" aria-labelledby="now-revealed" className="gap-4 p-5">
      <Overline as="h2" id="now-revealed" className="flex items-center gap-2">
        <EyeIcon aria-hidden className="size-4" />
        {t.log.nowRevealed}
      </Overline>
      <p className="font-serif text-2xl font-semibold">{problem.pattern}</p>

      {previous !== null && (
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col items-start gap-1.5">
            <p className="font-mono text-xs text-muted-foreground">
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
            <p className="font-mono text-sm text-primary">
              {describeDifference(today.timeMinutes, previous.timeMinutes)}
            </p>
          </div>
        </div>
      )}

      {previous?.keyInsight !== undefined && (
        <blockquote className="border-l-2 pl-3 font-serif">{previous.keyInsight}</blockquote>
      )}
      {today.keyInsight !== "" && (
        <blockquote className="border-l-2 border-primary pl-3 font-serif">
          {today.keyInsight}
        </blockquote>
      )}

      <div className="flex flex-wrap gap-x-5">
        <ExternalLink href={`https://neetcode.io/solutions/${problem.id}`} className={LINK_CLASSES}>
          {t.log.solutionLink}
        </ExternalLink>
        {problem.videoId !== undefined && (
          <ExternalLink
            href={`https://www.youtube.com/watch?v=${problem.videoId}`}
            className={LINK_CLASSES}
          >
            {t.log.videoLink}
          </ExternalLink>
        )}
      </div>
    </Card>
  );
}
