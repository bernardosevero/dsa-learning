import { EyeOffIcon } from "lucide-react";
import { useNavigate } from "react-router";

import { lastAttempt } from "@/domain/schedule";
import type { Entry, Problem } from "@/domain/types";
import { useAppData } from "@/ui/AppData";
import { NoteBox } from "@/ui/components/NoteBox";
import { formatMonthDay } from "@/ui/format";
import { t } from "@/ui/strings";

import { ProblemKindBadge } from "./ProblemKindBadge";
import { SolvingActions } from "./SolvingActions";
import { SolvingFrame } from "./SolvingFrame";
import { SolvingHeader } from "./SolvingHeader";
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

export interface SolvingScreenProps {
  problem: Problem;
  /** ISO start of this problem's timer, or undefined in the moment before it starts. */
  startedAt: string | undefined;
}

/** S2 for one problem: links out to NeetCode, the timer against the time box, and the way to Log. */
export function SolvingScreen({ problem, startedAt }: SolvingScreenProps) {
  const { states, file, clearTimer } = useAppData();
  const navigate = useNavigate();
  const isReview = (states[problem.id]?.status ?? "new") !== "new";
  const shouldShowPattern = !isReview || file.settings.showPatternOnReviews;

  function handleCancel() {
    clearTimer();
    void navigate("/");
  }

  return (
    <SolvingFrame
      badge={<ProblemKindBadge isReview={isReview} isPatternHidden={!shouldShowPattern} />}
    >
      <title>{t.documentTitle(`${t.pages.solving} ${problem.title}`)}</title>
      <SolvingHeader
        problem={problem}
        meta={describeProblem(problem, file.entries, isReview, shouldShowPattern)}
      />
      {startedAt !== undefined && (
        <TimerCard
          startedAt={startedAt}
          timeBoxMinutes={file.settings.timeBoxMinutes[problem.difficulty]}
          difficulty={problem.difficulty}
        />
      )}
      {isReview && <NoteBox Icon={EyeOffIcon}>{t.solving.reviewTip}</NoteBox>}
      <SolvingActions problemId={problem.id} onCancel={handleCancel} />
    </SolvingFrame>
  );
}
