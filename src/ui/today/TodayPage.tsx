import { useMemo } from "react";
import { Link } from "react-router";

import { buildToday, countStatuses } from "@/domain/today";
import { useAppData } from "@/ui/AppData";
import { formatDate } from "@/ui/format";
import { t } from "@/ui/strings";

import { CaughtUp } from "./CaughtUp";
import { Counters } from "./Counters";
import { DueReviews } from "./DueReviews";
import { NextNewProblem } from "./NextNewProblem";

// Today's list and counters, recomputed from the log whenever it or the day changes.
function useTodayView() {
  const { problems, states, file, todayDate } = useAppData();
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
  return { view, counts };
}

/** S1: what to re-solve today, most at risk first, plus the next new problem. */
export function TodayPage() {
  const { problems, file, todayDate } = useAppData();
  const { view, counts } = useTodayView();

  return (
    <>
      <title>{t.documentTitle(t.pages.today)}</title>
      <div className="mb-6 flex items-baseline justify-between gap-3">
        <h1 className="font-serif text-3xl">{t.pages.today}</h1>
        <span className="font-mono text-sm text-muted-foreground">{formatDate(todayDate)}</span>
      </div>
      <div className="flex flex-col gap-7">
        <Counters counts={counts} />
        {view.kind === "caught-up" && <CaughtUp nextDue={view.nextDue} />}
        {view.kind === "list" && (
          <DueReviews
            reviews={view.reviews}
            estimateMinutes={view.estimateMinutes}
            shouldShowPattern={file.settings.showPatternOnReviews}
          />
        )}
        {view.kind === "list" && view.nextNew !== null && view.newTopic !== null && (
          <NextNewProblem problem={view.nextNew} topic={view.newTopic} />
        )}
        <Link
          to="/problems"
          className="self-center text-sm text-primary underline-offset-4 hover:underline"
        >
          {t.today.browseAll(problems.length)}
        </Link>
      </div>
    </>
  );
}
