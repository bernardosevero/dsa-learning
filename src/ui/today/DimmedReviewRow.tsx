import type { Problem } from "@/domain/types";
import { StartLink } from "@/ui/components/StartLink";

export interface DimmedReviewRowProps {
  problem: Problem;
  meta: string;
}

/** A due review after the focus: muted text rather than opacity, so it keeps its contrast. */
export function DimmedReviewRow({ problem, meta }: DimmedReviewRowProps) {
  return (
    <li className="flex items-center justify-between gap-4 border-b py-3 pl-5 text-muted-foreground">
      <div className="flex min-w-0 flex-col">
        <p>{problem.title}</p>
        <p className="font-mono text-sm">{meta}</p>
      </div>
      <StartLink problem={problem} variant="muted" />
    </li>
  );
}
