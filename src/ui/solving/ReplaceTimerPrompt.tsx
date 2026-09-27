import { Link } from "react-router";

import type { Problem } from "@/domain/types";
import { Button } from "@/ui/components/ui/button";
import { t } from "@/ui/strings";

export interface ReplaceTimerPromptProps {
  /** The problem whose timer is already running. */
  runningProblem: Problem;
  onReplace: () => void;
}

/** Asked before starting this problem's timer would throw away another problem's. */
export function ReplaceTimerPrompt({ runningProblem, onReplace }: ReplaceTimerPromptProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <p className="font-semibold">{t.solving.replaceTimer(runningProblem.title)}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={onReplace} className="min-h-11">
          {t.solving.replace}
        </Button>
        <Button asChild variant="outline" className="min-h-11 bg-card shadow-none">
          <Link to={`/solve/${runningProblem.id}`}>
            {t.solving.keepOther(runningProblem.title)}
          </Link>
        </Button>
      </div>
    </div>
  );
}
