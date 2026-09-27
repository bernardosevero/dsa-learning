import type { Problem } from "@/domain/types";
import { StartLink } from "@/ui/components/StartLink";
import { t } from "@/ui/strings";

export interface FocusReviewCardProps {
  problem: Problem;
  meta: string;
}

/** The first due review: the one obvious next action, marked ★. */
export function FocusReviewCard({ problem, meta }: FocusReviewCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border-[1.5px] border-primary bg-card p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">
          {t.today.focus}
        </p>
        <p className="font-serif text-2xl font-semibold">{problem.title}</p>
        <p className="font-mono text-sm text-muted-foreground">{meta}</p>
      </div>
      <StartLink problem={problem} variant="primary" />
    </div>
  );
}
