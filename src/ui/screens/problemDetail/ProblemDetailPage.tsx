import { ChevronLeftIcon, EyeOffIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { daysBetween } from "@/domain/dates";
import { problemHistory } from "@/domain/history";
import { statusOf, type ProblemStatus } from "@/domain/problemList";
import type { Entry, LocalDate, Problem, ProblemState } from "@/domain/types";
import { useAppData } from "@/ui/app/AppData";
import { Button } from "@/ui/primitives/button";
import { ExternalLink } from "@/ui/shared/ExternalLink";
import { formatMonthDay } from "@/ui/shared/format";
import { MarkMasteredDialog } from "@/ui/shared/MarkMasteredDialog";
import { StatusBadge } from "@/ui/shared/StatusBadge";
import { t } from "@/ui/shared/strings";

import { HistoryList } from "./HistoryList";
import { SpoilerPanel } from "./SpoilerPanel";

// A problem with no derived state has no entries, so it is new.
const NEW_PROBLEM: ProblemState = { status: "new" };

function hasInsight(entry: Entry): boolean {
  return entry.type === "attempt" && entry.keyInsight !== undefined;
}

// "3 days overdue", "due today" or "next Oct 8": only an active problem has a next date.
function describeDue(state: ProblemState, status: ProblemStatus, todayDate: LocalDate): string {
  if (state.status !== "active") {
    return "";
  }
  if (status === "scheduled") {
    return t.problemDetail.nextDue(formatMonthDay(state.dueDate));
  }
  const daysOverdue = daysBetween(state.dueDate, todayDate);
  return daysOverdue === 0 ? t.problemDetail.dueToday : t.today.daysOverdue(daysOverdue);
}

/** S5: one problem's details, links and history, keeping a due review's spoilers hidden. */
export function ProblemDetailPage() {
  const { problemId } = useParams();
  const { problems, states, file, todayDate, markMastered, deleteEntry } = useAppData();
  const [isRevealed, setIsRevealed] = useState(false);
  const [problemToMark, setProblemToMark] = useState<Problem | null>(null);
  const history = useMemo(
    () => problemHistory(file.entries, problemId ?? ""),
    [file.entries, problemId],
  );

  const problem = problems.find((candidate) => candidate.id === problemId);
  if (problem === undefined) {
    return (
      <>
        <title>{t.documentTitle(t.pages.problemDetail)}</title>
        <h1 className="mb-4 font-serif text-3xl">{t.pages.problemDetail}</h1>
        <p>{t.solving.notFound}</p>
      </>
    );
  }

  const state = states[problem.id] ?? NEW_PROBLEM;
  const status = statusOf(state, todayDate);
  // The spoiler rule: a due review hides its pattern, earlier insights, solution and video.
  const shouldHideSpoilers = status === "due" && !isRevealed;
  const isPatternShown = !shouldHideSpoilers || file.settings.showPatternOnReviews;
  const insightCount = history.filter(hasInsight).length;
  const due = describeDue(state, status, todayDate);

  function handleConfirmMastered(problemToConfirm: Problem) {
    markMastered(problemToConfirm.id);
    setProblemToMark(null);
  }

  return (
    <>
      <title>{t.documentTitle(problem.title)}</title>
      <div className="flex flex-col gap-6">
        <Button asChild variant="ghost" className="-ml-3 self-start text-muted-foreground">
          <Link to="/problems">
            <ChevronLeftIcon aria-hidden />
            {t.problemDetail.backToProblems}
          </Link>
        </Button>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <StatusBadge status={status} />
            <p className="text-sm text-muted-foreground">
              {isPatternShown && `${problem.pattern}${t.separator}`}
              {problem.difficulty}
              {due !== "" && (
                <>
                  {t.separator}
                  <span className="font-mono">{due}</span>
                </>
              )}
            </p>
          </div>
          <h1 className="font-serif text-3xl font-semibold">{problem.title}</h1>
          <p>{problem.summary}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <Button asChild className="px-5">
            <Link to={`/solve/${problem.id}`}>
              {t.problemDetail.start} <span className="sr-only">{problem.title}</span>
            </Link>
          </Button>
          <ExternalLink href={problem.neetcodeUrl} variant="outline">
            {t.problemDetail.neetCode}
          </ExternalLink>
          <ExternalLink href={problem.leetcodeUrl}>{t.problemDetail.leetCode}</ExternalLink>
          {status !== "mastered" && (
            <Button
              variant="link"
              onClick={() => setProblemToMark(problem)}
              className="ml-auto px-0 text-muted-foreground"
            >
              {t.problemDetail.markMastered}
            </Button>
          )}
        </div>

        {shouldHideSpoilers ? (
          <SpoilerPanel
            isPatternHidden={!isPatternShown}
            insightCount={insightCount}
            onReveal={() => setIsRevealed(true)}
          />
        ) : (
          <SolutionLinks
            problem={problem}
            canHide={status === "due"}
            onHide={() => setIsRevealed(false)}
          />
        )}

        <HistoryList
          history={history}
          shouldHideNotes={shouldHideSpoilers}
          onDelete={deleteEntry}
        />
      </div>
      <MarkMasteredDialog
        problem={problemToMark}
        onConfirm={handleConfirmMastered}
        onClose={() => setProblemToMark(null)}
      />
    </>
  );
}

interface SolutionLinksProps {
  problem: Problem;
  /** A due review revealed on request can be hidden again. */
  canHide: boolean;
  onHide: () => void;
}

/** The solution and video, folded away in a details element since they are spoilers. */
function SolutionLinks({ problem, canHide, onHide }: SolutionLinksProps) {
  return (
    <div className="flex flex-col gap-2">
      <details className="rounded-xl border bg-card px-4 py-3">
        <summary className="flex min-h-11 cursor-pointer items-center font-medium">
          {t.problemDetail.solutionAndVideo}
        </summary>
        <div className="mt-2 flex flex-wrap gap-x-4">
          <ExternalLink href={`https://neetcode.io/solutions/${problem.id}`}>
            {t.problemDetail.solutionLink}
          </ExternalLink>
          {problem.videoId !== undefined && (
            <ExternalLink href={`https://www.youtube.com/watch?v=${problem.videoId}`}>
              {t.problemDetail.videoLink}
            </ExternalLink>
          )}
        </div>
      </details>
      {canHide && (
        <Button variant="ghost" aria-expanded onClick={onHide} className="self-start">
          <EyeOffIcon aria-hidden />
          {t.problemDetail.hide}
        </Button>
      )}
    </div>
  );
}
