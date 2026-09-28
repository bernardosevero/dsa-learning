import { CircleCheckBigIcon, EyeIcon } from "lucide-react";
import { Link } from "react-router";

import { daysBetween } from "@/domain/dates";
import type { Attempt, Help, Problem, Rating } from "@/domain/types";
import { useAppData } from "@/ui/AppData";
import { ExternalLink } from "@/ui/components/ExternalLink";
import { FocusFrame } from "@/ui/components/FocusFrame";
import { RatingChip } from "@/ui/components/RatingChip";
import { Button } from "@/ui/components/ui/button";
import { formatDate, formatMonthDay } from "@/ui/format";
import { t } from "@/ui/strings";

import type { SavedLog, ValidLog } from "./logForm";

const LABEL_CLASSES = "text-xs font-semibold tracking-widest text-muted-foreground uppercase";
const LINK_CLASSES = "flex min-h-11 items-center gap-1 text-sm text-primary hover:underline";

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
        <div className="flex flex-col gap-1 rounded-xl border bg-card p-5">
          <p className={LABEL_CLASSES}>{t.log.nextResolve(state.dueDate)}</p>
          <p className="font-mono text-3xl">{formatDate(state.dueDate)}</p>
          <p className="font-mono text-sm text-muted-foreground">
            {t.today.inDays(daysBetween(todayDate, state.dueDate))}
          </p>
        </div>
      )}

      {/* Mastered is quiet on purpose: no animation. */}
      {state?.status === "mastered" && (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
          <span className="rounded-full border-2 border-status-mastered p-1.5">
            <CircleCheckBigIcon aria-hidden className="size-8 text-status-mastered" />
          </span>
          <p className="text-sm font-semibold tracking-widest text-status-mastered uppercase">
            {t.log.mastered}
          </p>
          <p className="text-muted-foreground">{t.log.masteredDetail}</p>
          <p className="font-mono text-sm">{t.log.masteredCount(masteredCount, problems.length)}</p>
        </div>
      )}

      <NowRevealed problem={problem} today={saved.log} previous={saved.previous} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="min-h-11 flex-1">
          <Link to="/">{t.log.backToToday}</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onUndo}
          className="min-h-11 bg-card shadow-none"
        >
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
    <section
      aria-labelledby="now-revealed"
      className="flex flex-col gap-4 rounded-xl border bg-card p-5"
    >
      <h2 id="now-revealed" className={`flex items-center gap-2 ${LABEL_CLASSES}`}>
        <EyeIcon aria-hidden className="size-4" />
        {t.log.nowRevealed}
      </h2>
      <p className="font-serif text-2xl font-semibold">{problem.pattern}</p>

      {previous !== null && (
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
    </section>
  );
}
