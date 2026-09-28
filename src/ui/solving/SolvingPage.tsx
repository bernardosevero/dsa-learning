import { useEffect, useEffectEvent } from "react";
import { useParams } from "react-router";

import { useAppData } from "@/ui/AppData";
import { FocusFrame } from "@/ui/components/FocusFrame";
import { t } from "@/ui/strings";

import { ReplaceTimerPrompt } from "./ReplaceTimerPrompt";
import { SolvingScreen } from "./SolvingScreen";

/**
 * The Solving route: starts this problem's timer on arrival, unless another problem's timer is
 * running, in which case it asks first.
 */
export function SolvingPage() {
  const { problemId } = useParams();
  const { problems, file, startTimer } = useAppData();
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
  return <SolvingScreen problem={problem} startedAt={startedAt} />;
}
