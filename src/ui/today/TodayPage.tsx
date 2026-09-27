import { useMemo } from "react";
import { Link } from "react-router";

import { buildToday, countStatuses } from "@/domain/today";
import { useAppData } from "@/ui/AppData";
import { formatDate } from "@/ui/format";
import { t } from "@/ui/strings";

import { CaughtUp } from "./CaughtUp";
import { Counters } from "./Counters";
import { FirstRun } from "./FirstRun";
import { TodayList } from "./TodayList";

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
              <TodayList view={view} shouldShowPattern={file.settings.showPatternOnReviews} />
            )}
          </>
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
