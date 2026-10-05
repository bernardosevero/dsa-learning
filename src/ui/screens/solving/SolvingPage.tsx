import { EyeOffIcon } from "lucide-react";
import { useEffect, useEffectEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { lastAttempt } from "@/domain/schedule";
import type { Entry, Problem } from "@/domain/types";
import { useAppData } from "@/ui/app/AppData";
import { ExternalLink } from "@/ui/shared/ExternalLink";
import { FocusFrame } from "@/ui/shared/FocusFrame";
import { ProblemKindBadge } from "@/ui/shared/ProblemKindBadge";
import { Alert, AlertDescription } from "@/ui/primitives/alert";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { formatMonthDay } from "@/ui/shared/format";
import { t } from "@/ui/shared/strings";

import { TimerCard } from "./TimerCard";

// The pattern shows on new problems; on reviews only if the user opted in, since spotting it is
// the exercise.
function describeProblem(
  problem: Problem,
  entries: readonly Entry[],
  isReview: boolean,
  shouldShowPattern: boolean,
): string {
  const parts: string[] = shouldShowPattern
    ? [problem.pattern, problem.difficulty]
    : [problem.difficulty];
  const lastSolved = isReview ? lastAttempt(entries, problem.id)?.date : undefined;
  if (lastSolved !== undefined) {
    parts.push(t.solving.lastSolved(formatMonthDay(lastSolved)));
  }
  return parts.join(t.separator);
}

/**
 * S2: links out to NeetCode, the timer against the time box, and the way to Log. Starts this
 * problem's timer on arrival, unless another problem's timer is running: then it asks first.
 */
export function SolvingPage() {
  const { problemId } = useParams();
  const { problems, states, file, startTimer, restartTimer, clearTimer } = useAppData();
  const navigate = useNavigate();
  const problem = problems.find((candidate) => candidate.id === problemId);
  const runningProblemId = file.activeTimer?.problemId;
  const runningProblem =
    runningProblemId === problemId
      ? undefined
      : problems.find((candidate) => candidate.id === runningProblemId);

  // Only on arrival: later timer changes come from the user (Replace, Cancel), and re-running this
  // then would restart a timer the user just cleared. A no-op when this problem's timer already runs.
  const startOnArrival = useEffectEvent(() => {
    if (problem !== undefined && runningProblem === undefined) {
      startTimer(problem.id);
    }
  });
  useEffect(() => {
    startOnArrival();
  }, [problemId]);

  if (problem === undefined) {
    return (
      <FocusFrame>
        <p>{t.solving.notFound}</p>
      </FocusFrame>
    );
  }
  if (runningProblem !== undefined) {
    return (
      <FocusFrame>
        <ReplaceTimerPrompt
          runningProblem={runningProblem}
          onReplace={() => startTimer(problem.id)}
        />
      </FocusFrame>
    );
  }

  const startedAt =
    file.activeTimer?.problemId === problem.id ? file.activeTimer.startedAt : undefined;
  const isReview = (states[problem.id]?.status ?? "new") !== "new";
  const shouldShowPattern = !isReview || file.settings.showPatternOnReviews;

  function handleCancel() {
    clearTimer();
    void navigate("/today");
  }

  return (
    <FocusFrame
      badge={<ProblemKindBadge isReview={isReview} isPatternHidden={!shouldShowPattern} />}
    >
      <title>{t.documentTitle(`${t.pages.solving} ${problem.title}`)}</title>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {describeProblem(problem, file.entries, isReview, shouldShowPattern)}
        </p>
        <h1 className="font-serif text-4xl font-semibold">{problem.title}</h1>
        <p className="text-base">{problem.summary}</p>
        <div className="flex items-center gap-4">
          <ExternalLink href={problem.neetcodeUrl} variant="default" className="flex-1">
            {t.solving.openOnNeetCode}
          </ExternalLink>
          <ExternalLink href={problem.leetcodeUrl}>{t.solving.leetCode}</ExternalLink>
        </div>
      </div>

      {/* Undefined only in the moment before the timer starts. */}
      {startedAt !== undefined && (
        <TimerCard
          startedAt={startedAt}
          timeBoxMinutes={file.settings.timeBoxMinutes[problem.difficulty]}
          difficulty={problem.difficulty}
          onRestart={() => restartTimer(problem.id)}
        />
      )}
      {isReview && (
        <Alert>
          <EyeOffIcon aria-hidden />
          <AlertDescription>{t.solving.reviewTip}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3">
        <Button asChild variant="dark">
          <Link to={`/log/${problem.id}`}>{t.solving.done}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/log/${problem.id}?help=solution`}>{t.solving.lookedAtSolution}</Link>
        </Button>
        <Button
          type="button"
          variant="link"
          onClick={handleCancel}
          className="self-center text-muted-foreground"
        >
          {t.solving.cancel}
        </Button>
      </div>
    </FocusFrame>
  );
}

interface ReplaceTimerPromptProps {
  /** The problem whose timer is already running. */
  runningProblem: Problem;
  onReplace: () => void;
}

/** Asked before starting this problem's timer would throw away another problem's. */
function ReplaceTimerPrompt({ runningProblem, onReplace }: ReplaceTimerPromptProps) {
  return (
    <Card className="gap-4 p-5">
      <p className="font-semibold">{t.solving.replaceTimer(runningProblem.title)}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={onReplace}>
          {t.solving.replace}
        </Button>
        <Button asChild variant="outline">
          <Link to={`/solve/${runningProblem.id}`}>
            {t.solving.keepOther(runningProblem.title)}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
