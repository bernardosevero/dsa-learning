import { Link } from "react-router";

import { buttonVariants } from "@/ui/components/ui/button";
import { cn } from "@/ui/lib/utils";
import { t } from "@/ui/strings";

export interface SolvingActionsProps {
  problemId: string;
  onCancel: () => void;
}

/** Log the attempt, log it having seen the solution, or drop it without logging. */
export function SolvingActions({ problemId, onCancel }: SolvingActionsProps) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        to={`/log/${problemId}`}
        className={cn(
          buttonVariants(),
          "min-h-11 bg-foreground text-background hover:bg-foreground/90",
        )}
      >
        {t.solving.done}
      </Link>
      <Link
        to={`/log/${problemId}?help=solution`}
        className={cn(buttonVariants({ variant: "outline" }), "min-h-11 bg-card shadow-none")}
      >
        {t.solving.lookedAtSolution}
      </Link>
      <button
        type="button"
        onClick={onCancel}
        className="min-h-11 self-center rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {t.solving.cancel}
      </button>
    </div>
  );
}
