import type { Problem } from "@/domain/types";
import { ExternalLink } from "@/ui/components/ExternalLink";
import { buttonVariants } from "@/ui/components/ui/button";
import { cn } from "@/ui/lib/utils";
import { t } from "@/ui/strings";

export interface SolvingHeaderProps {
  problem: Problem;
  /** Difficulty, plus the pattern only where the spoiler rule allows it. */
  meta: string;
}

/** The problem's title and summary, and the links out to solve it. */
export function SolvingHeader({ problem, meta }: SolvingHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{meta}</p>
      <h1 className="font-serif text-4xl font-semibold">{problem.title}</h1>
      <p className="text-base">{problem.summary}</p>
      <div className="flex items-center gap-4">
        <ExternalLink
          href={problem.neetcodeUrl}
          className={cn(buttonVariants(), "min-h-11 flex-1")}
        >
          {t.solving.openOnNeetCode}
        </ExternalLink>
        <ExternalLink
          href={problem.leetcodeUrl}
          className="flex min-h-11 items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
        >
          {t.solving.leetCode}
        </ExternalLink>
      </div>
    </div>
  );
}
