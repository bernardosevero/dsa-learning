import { EyeIcon } from "lucide-react";

import type { Attempt, Problem } from "@/domain/types";
import { ExternalLink } from "@/ui/components/ExternalLink";
import { t } from "@/ui/strings";

import { AttemptComparison } from "./AttemptComparison";
import type { ValidLog } from "./logForm";

const LINK_CLASSES = "flex min-h-11 items-center gap-1 text-sm text-primary hover:underline";

export interface NowRevealedProps {
  problem: Problem;
  today: ValidLog;
  previous: Attempt | null;
}

/** Everything the spoiler rule hid until now: the pattern, earlier insights, solution and video. */
export function NowRevealed({ problem, today, previous }: NowRevealedProps) {
  return (
    <section
      aria-labelledby="now-revealed"
      className="flex flex-col gap-4 rounded-xl border bg-card p-5"
    >
      <h2
        id="now-revealed"
        className="flex items-center gap-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase"
      >
        <EyeIcon aria-hidden className="size-4" />
        {t.log.nowRevealed}
      </h2>
      <p className="font-serif text-2xl font-semibold">{problem.pattern}</p>
      {previous !== null && <AttemptComparison previous={previous} today={today} />}
      {previous?.keyInsight !== undefined && (
        <blockquote className="border-l-2 pl-3 font-serif">{previous.keyInsight}</blockquote>
      )}
      {today.keyInsight !== "" && (
        <blockquote className="border-l-2 border-primary pl-3 font-serif">
          {today.keyInsight}
        </blockquote>
      )}
      <div className="flex flex-wrap gap-x-5">
        <ExternalLink href={`https://neetcode.io/solutions/${problem.id}`} className={LINK_CLASSES}>
          {t.log.solutionLink}
        </ExternalLink>
        {problem.videoId !== undefined && (
          <ExternalLink
            href={`https://www.youtube.com/watch?v=${problem.videoId}`}
            className={LINK_CLASSES}
          >
            {t.log.videoLink}
          </ExternalLink>
        )}
      </div>
    </section>
  );
}
