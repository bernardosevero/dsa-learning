import { CircleCheckBigIcon, CircleCheckIcon } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";

import { daysBetween } from "@/domain/dates";
import { buildToday, countStatuses } from "@/domain/today";
import type { LocalDate } from "@/domain/types";
import { useAppData } from "@/ui/app/AppData";
import { Overline } from "@/ui/shared/Overline";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { formatDate } from "@/ui/shared/format";
import { t } from "@/ui/shared/strings";

import { DueReviews } from "./DueReviews";
import { FirstRun } from "./FirstRun";
import { NextNewProblem } from "./NextNewProblem";

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
  const isFirstRun = counts.newLeft === problems.length;

  return (
    <>
      <title>{t.documentTitle(t.pages.today)}</title>
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h1 className="font-serif text-3xl">{t.pages.today}</h1>
        <span className="font-mono text-sm text-muted-foreground">{formatDate(todayDate)}</span>
      </div>
      <div className="flex flex-col gap-7">
        {isFirstRun && view.kind === "list" && view.nextNew !== null ? (
          <FirstRun firstProblem={view.nextNew} />
        ) : (
          <>
            <Counters counts={counts} />
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
          </>
        )}
        <Button asChild variant="link" className="self-center">
          <Link to="/problems">{t.today.browseAll(problems.length)}</Link>
        </Button>
      </div>
    </>
  );
}

interface CountersProps {
  counts: { due: number; newLeft: number; mastered: number };
}

/** The Due · New left · Mastered strip at the top of Today. */
function Counters({ counts }: CountersProps) {
  const items = [
    { label: t.today.counters.due, value: counts.due },
    { label: t.today.counters.newLeft, value: counts.newLeft },
    { label: t.today.counters.mastered, value: counts.mastered },
  ];
  return (
    <Card>
      <dl className="grid grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col-reverse px-4 py-3 not-first:border-l">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="font-mono text-2xl">{item.value}</dd>
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
