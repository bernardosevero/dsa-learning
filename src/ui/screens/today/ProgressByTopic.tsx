import { Link } from "react-router";

import type { TopicGroup } from "@/domain/problemList";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { cn } from "@/ui/primitives/cn";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { t } from "@/ui/shared/strings";
import { TopicBar } from "@/ui/shared/TopicBar";

const HEADING_ID = "progress-by-topic-heading";

export interface ProgressByTopicProps {
  /** The topics to list: started ones plus the next new problem's topic, in NeetCode order. */
  topics: readonly TopicGroup[];
  /** Every topic in the list, for the link to Problems. */
  topicCount: number;
}

/** How far along each topic is, beside Today's content on wide windows and under it otherwise. */
export function ProgressByTopic({ topics, topicCount }: ProgressByTopicProps) {
  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col">
      <SectionLabel id={HEADING_ID}>{t.today.progress.title}</SectionLabel>
      <Legend />
      <Card className="px-4 py-3.5">
        <ul className="flex flex-col gap-3">
          {topics.map((topic) => (
            <TopicRow key={topic.pattern} topic={topic} />
          ))}
        </ul>
      </Card>
      <Button asChild variant="link" className="mt-2 self-start px-0">
        <Link to="/problems">{t.today.progress.allTopics(topicCount)}</Link>
      </Button>
    </section>
  );
}

/** Says which colour is which, so the bars don't rely on colour alone. */
function Legend() {
  const items = [
    { label: t.today.progress.legendMastered, swatch: "bg-status-mastered" },
    { label: t.today.progress.legendStarted, swatch: "bg-primary" },
  ];
  return (
    <div aria-hidden className="mb-3 flex gap-3 text-xs text-muted-foreground">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-2.5 rounded-sm", item.swatch)} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

interface TopicRowProps {
  topic: TopicGroup;
}

/** One topic: its name, its bar and "started/total". The next new problem's topic is bold. */
function TopicRow({ topic }: TopicRowProps) {
  const isNextTopic = topic.rows.some((row) => row.isUpNext);
  const hasStarted = topic.startedOrMastered > 0;
  const startedOnly = topic.startedOrMastered - topic.mastered;
  return (
    <li
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_6rem_2.75rem] items-center gap-3 text-sm",
        // max-wide: our `wide` breakpoint sorts before `sm`, so sm's width must stop at wide.
        "sm:max-wide:grid-cols-[minmax(0,1fr)_10rem_2.75rem]",
        "wide:grid-cols-[minmax(0,1fr)_4.5rem_2.25rem]",
        isNextTopic && "font-semibold",
        !hasStarted && "text-muted-foreground",
      )}
    >
      <span className="min-w-0">{topic.pattern}</span>
      <TopicBar topic={topic} className="w-full" />
      <span className="text-right font-mono font-normal text-muted-foreground">
        {topic.startedOrMastered}/{topic.total}
      </span>
      <span className="sr-only">
        {t.today.progress.topicSummary(topic.mastered, startedOnly, topic.total)}
      </span>
    </li>
  );
}
