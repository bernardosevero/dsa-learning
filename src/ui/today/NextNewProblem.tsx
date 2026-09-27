import type { Problem } from "@/domain/types";
import { SectionLabel } from "@/ui/components/SectionLabel";
import { StartLink } from "@/ui/components/StartLink";
import { TopicProgress } from "@/ui/components/TopicProgress";
import { t } from "@/ui/strings";

const HEADING_ID = "new-problem-heading";

export interface NextNewProblemProps {
  problem: Problem;
  topic: { pattern: string; done: number; total: number };
}

/** The one new problem to start next, in NeetCode order, with its topic's progress. */
export function NextNewProblem({ problem, topic }: NextNewProblemProps) {
  return (
    <section aria-labelledby={HEADING_ID}>
      <SectionLabel id={HEADING_ID} aside={<TopicProgress done={topic.done} total={topic.total} />}>
        {t.today.newSection}
        {t.separator}
        {topic.pattern}
      </SectionLabel>
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
        <div className="flex min-w-0 flex-col">
          <p className="font-semibold">{problem.title}</p>
          <p className="text-sm text-muted-foreground">
            {problem.pattern}
            {t.separator}
            {problem.difficulty}
          </p>
        </div>
        <StartLink problem={problem} variant="outline" />
      </div>
    </section>
  );
}
