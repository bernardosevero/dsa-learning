import { ChevronRightIcon } from "lucide-react";
import { useId } from "react";

import type { TopicGroup } from "@/domain/problemList";
import type { LocalDate, Problem } from "@/domain/types";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { cn } from "@/ui/primitives/cn";
import { t } from "@/ui/shared/strings";

import { ProblemTableRow } from "./ProblemTableRow";

const PERCENT = 100;

export interface TopicSectionProps {
  topic: TopicGroup;
  isExpanded: boolean;
  todayDate: LocalDate;
  onToggle: (pattern: string) => void;
  onMarkMastered: (problem: Problem) => void;
}

/** One topic as a card: a header that expands it, then its problems as table rows. */
export function TopicSection({
  topic,
  isExpanded,
  todayDate,
  onToggle,
  onMarkMastered,
}: TopicSectionProps) {
  const headingId = useId();
  const tableId = useId();

  function handleToggle() {
    onToggle(topic.pattern);
  }

  return (
    <section aria-labelledby={headingId}>
      <Card>
        <h2>
          <Button
            id={headingId}
            variant="ghost"
            aria-expanded={isExpanded}
            aria-controls={isExpanded ? tableId : undefined}
            onClick={handleToggle}
            className="h-auto w-full flex-wrap justify-start gap-x-3 gap-y-1 rounded-xl px-4 py-3 text-left whitespace-normal"
          >
            <ChevronRightIcon aria-hidden className={cn(isExpanded && "rotate-90")} />
            <span className="min-w-0 flex-1 font-semibold">{topic.pattern}</span>
            {topic.due > 0 && (
              <span className="text-sm text-primary">{t.problems.topicDue(topic.due)}</span>
            )}
            {topic.mastered > 0 && (
              <span className="text-sm text-status-mastered">
                {t.problems.topicMastered(topic.mastered)}
              </span>
            )}
            <TopicProgressBar topic={topic} />
            <span aria-hidden className="font-mono text-sm text-muted-foreground">
              {topic.startedOrMastered}/{topic.total}
            </span>
            <span className="sr-only">
              {t.problems.topicProgress(topic.startedOrMastered, topic.total)}
            </span>
          </Button>
        </h2>
        {isExpanded && (
          <table id={tableId} className="w-full table-fixed text-left">
            <colgroup>
              <col />
              <col className="hidden w-[84px] min-[440px]:table-column" />
              <col className="w-[70px]" />
              <col className="w-[116px]" />
              <col className="w-[48px]" />
            </colgroup>
            <thead className="text-xs text-muted-foreground">
              <tr className="border-t">
                <th scope="col" className="py-2 pr-2 pl-4 font-medium">
                  {t.problems.columns.problem}
                </th>
                <th scope="col" className="hidden px-2 font-medium min-[440px]:table-cell">
                  {t.problems.columns.lastRating}
                </th>
                <th scope="col" className="px-2 font-medium">
                  {t.problems.columns.next}
                </th>
                <th scope="col" className="px-2 font-medium">
                  {t.problems.columns.status}
                </th>
                <th scope="col">
                  <span className="sr-only">{t.problems.actionsColumn}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {topic.rows.map((row) => (
                <ProblemTableRow
                  key={row.problem.id}
                  row={row}
                  todayDate={todayDate}
                  onMarkMastered={onMarkMastered}
                />
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </section>
  );
}

interface TopicProgressBarProps {
  topic: TopicGroup;
}

/** A 96px bar: mastered in plum, then started in green, over the rest of the topic. */
function TopicProgressBar({ topic }: TopicProgressBarProps) {
  const masteredShare = (topic.mastered / topic.total) * PERCENT;
  const startedShare = ((topic.startedOrMastered - topic.mastered) / topic.total) * PERCENT;
  return (
    <span
      aria-hidden
      className="hidden h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-border sm:flex"
    >
      <span className="bg-status-mastered" style={{ width: `${masteredShare}%` }} />
      <span className="bg-primary" style={{ width: `${startedShare}%` }} />
    </span>
  );
}
