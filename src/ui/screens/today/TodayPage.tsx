import { CircleCheckBigIcon, CircleCheckIcon } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";

import { daysBetween } from "@/domain/dates";
import { groupByTopic, listTopicsInProgress } from "@/domain/problemList";
import { buildToday, countStatuses } from "@/domain/today";
import type { LocalDate } from "@/domain/types";
import { useAppData } from "@/ui/app/AppData";
import { Overline } from "@/ui/shared/Overline";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { cn } from "@/ui/primitives/cn";
import { formatDate } from "@/ui/shared/format";
import { t } from "@/ui/shared/strings";

import { DueReviews } from "./DueReviews";
import { FirstRun } from "./FirstRun";
import { NextNewProblem } from "./NextNewProblem";
import { ProgressByTopic } from "./ProgressByTopic";

/** S1: what to re-solve today, most at risk first, plus the next new problem. */
export function TodayPage() {
  const { problems, states, file, todayDate } = useAppData();
  // Recomputed from the log only when it or the day changes.
  const view = useMemo(
    () =>
      buildToday({
        problems,
        states,
        entries: file.entries,
        settings: file.settings,
        today: todayDate,
      }),
    [problems, states, file.entries, file.settings, todayDate],
  );
  const counts = useMemo(
    () => countStatuses(problems, states, todayDate),
    [problems, states, todayDate],
  );
  const topics = useMemo(
    () => groupByTopic(problems, states, todayDate),
    [problems, states, todayDate],
  );
  const topicsInProgress = useMemo(() => listTopicsInProgress(topics), [topics]);
  const isFirstRun = counts.newLeft === problems.length;
  const browseAll = (
    <Button asChild variant="link" className="self-center wide:col-start-1 wide:row-start-3">
      <Link to="/problems">{t.today.browseAll(problems.length)}</Link>
    </Button>
  );

  return (
    <>
      <title>{t.documentTitle(t.pages.today)}</title>
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h1 className="font-serif text-3xl">{t.pages.today}</h1>
        <span className="font-mono text-sm text-muted-foreground">{formatDate(todayDate)}</span>
      </div>
      {isFirstRun && view.kind === "list" && view.nextNew !== null ? (
        <div className="flex flex-col gap-7">
          <FirstRun firstProblem={view.nextNew} />
          {browseAll}
        </div>
      ) : (
        // One grid so the counters render once: stacked in a sidebar from `wide`, on top below it.
        <div
          className={cn(
            "flex flex-col gap-7",
            "wide:grid wide:grid-cols-[minmax(0,1fr)_300px] wide:grid-rows-[auto_1fr] wide:gap-x-10",
          )}
        >
          <Counters counts={counts} className="wide:col-start-2 wide:row-start-1 wide:self-start" />
          <div className="flex flex-col gap-7 wide:col-start-1 wide:row-span-2 wide:row-start-1">
            {view.kind === "caught-up" && <CaughtUp nextDue={view.nextDue} todayDate={todayDate} />}
            {view.kind === "list" && (
              <DueReviews
                reviews={view.reviews}
                estimateMinutes={view.estimateMinutes}
                shouldShowPattern={file.settings.showPatternOnReviews}
              />
            )}
            {/* With nothing due, the new problem becomes the focus. */}
            {view.kind === "list" && view.nextNew !== null && view.newTopic !== null && (
              <NextNewProblem
                problem={view.nextNew}
                topic={view.newTopic}
                isFocus={view.reviews.length === 0}
              />
            )}
          </div>
          <div className="wide:col-start-2 wide:row-start-2 wide:self-start">
            <ProgressByTopic topics={topicsInProgress} topicCount={topics.length} />
          </div>
          {browseAll}
        </div>
      )}
    </>
  );
}

interface CountersProps {
  counts: { due: number; newLeft: number; mastered: number };
  /** Where it sits in Today's grid. */
  className?: string;
}

/** Due · New left · Mastered: a strip on top, or stacked rows in the sidebar from `wide`. */
function Counters({ counts, className }: CountersProps) {
  const items = [
    { label: t.today.counters.due, value: counts.due },
    { label: t.today.counters.newLeft, value: counts.newLeft },
    { label: t.today.counters.mastered, value: counts.mastered },
  ];
  return (
    <Card className={className}>
      <dl className="grid grid-cols-3 wide:grid-cols-1">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn(
              "flex flex-col-reverse px-4 py-3 not-first:border-l",
              "wide:flex-row wide:items-baseline wide:justify-between",
              "wide:not-first:border-t wide:not-first:border-l-0",
            )}
          >
            <dt className="text-xs text-muted-foreground wide:text-sm">{item.label}</dt>
            <dd className="font-mono text-2xl wide:text-xl">{item.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

interface CaughtUpProps {
  /** null when nothing is scheduled any more: every problem is mastered. */
  nextDue: LocalDate | null;
  todayDate: LocalDate;
}

/** Shown instead of the list when nothing is due and no new problem is left. */
function CaughtUp({ nextDue, todayDate }: CaughtUpProps) {
  if (nextDue === null) {
    return (
      <Card className="items-center gap-3 p-8 text-center">
        <CircleCheckBigIcon aria-hidden className="size-8 text-status-mastered" />
        <h2 className="font-serif text-2xl font-semibold">{t.today.everythingMastered}</h2>
        <p className="text-muted-foreground">{t.today.everythingMasteredDetail}</p>
        <Button asChild variant="outline">
          <Link to="/problems">{t.today.openProblems}</Link>
        </Button>
      </Card>
    );
  }
  return (
    <Card className="items-center gap-3 p-8 text-center">
      <CircleCheckIcon aria-hidden className="size-8 text-primary" />
      <h2 className="font-serif text-2xl font-semibold">{t.today.caughtUp}</h2>
      <p className="text-muted-foreground">{t.today.caughtUpDetail}</p>
      <div className="mt-2 flex flex-col gap-1 rounded-xl bg-muted px-5 py-3">
        <Overline as="span">{t.today.nextReview}</Overline>
        <span className="font-mono">
          {formatDate(nextDue)}
          {t.separator}
          {t.today.inDays(daysBetween(todayDate, nextDue))}
        </span>
      </div>
    </Card>
  );
}
