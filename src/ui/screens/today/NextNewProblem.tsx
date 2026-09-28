import type { Problem } from "@/domain/types";
import { SectionLabel } from "./SectionLabel";
import { StartLink } from "./StartLink";
import { TopicProgress } from "./TopicProgress";
import { Card } from "@/ui/primitives/card";
import { t } from "@/ui/shared/strings";

import { FocusCard } from "./FocusCard";

const HEADING_ID = "new-problem-heading";

export interface NextNewProblemProps {
  problem: Problem;
  topic: { pattern: string; done: number; total: number };
  /** With nothing due, the new problem is the day's one obvious action. */
  isFocus: boolean;
}

/** The one new problem to start next, in NeetCode order, with its topic's progress. */
export function NextNewProblem({ problem, topic, isFocus }: NextNewProblemProps) {
  const details = `${problem.pattern}${t.separator}${problem.difficulty}`;
  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-3">
      <SectionLabel id={HEADING_ID} aside={<TopicProgress done={topic.done} total={topic.total} />}>
        {t.today.newSection}
        {t.separator}
        {topic.pattern}
      </SectionLabel>
      {isFocus ? (
        <FocusCard label={t.today.upNext} problem={problem} meta={details} />
      ) : (
        <Card className="flex-row items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 flex-col">
            <p className="font-semibold">{problem.title}</p>
            <p className="text-sm text-muted-foreground">{details}</p>
          </div>
          <StartLink problem={problem} variant="outline" />
        </Card>
      )}
    </section>
  );
}
