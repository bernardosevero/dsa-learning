import { ArrowUpRightIcon, LockIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/ui/primitives/card";
import { cn } from "@/ui/primitives/cn";
import { t } from "@/ui/shared/strings";

const { spoilerExample } = t.howItWorks;

interface ExampleCardProps {
  title: string;
  isRevealed: boolean;
  pattern: ReactNode;
  insight: ReactNode;
  solution: ReactNode;
}

function ExampleCard({ title, isRevealed, pattern, insight, solution }: ExampleCardProps) {
  return (
    <Card className="gap-3 p-5">
      <p
        className={cn(
          "font-mono text-xs tracking-[0.06em] uppercase",
          isRevealed ? "text-primary" : "text-muted-foreground",
        )}
      >
        {title}
      </p>
      <p className="font-semibold">{spoilerExample.exampleProblem}</p>
      <dl className="flex flex-col gap-2.5 text-sm">
        <ExampleRow term={spoilerExample.pattern}>{pattern}</ExampleRow>
        <ExampleRow term={spoilerExample.insight}>{insight}</ExampleRow>
        <ExampleRow term={spoilerExample.solution}>{solution}</ExampleRow>
      </dl>
    </Card>
  );
}

interface ExampleRowProps {
  term: string;
  children: ReactNode;
}

function ExampleRow({ term, children }: ExampleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{term}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

function Hidden() {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <LockIcon aria-hidden className="size-3.5" />
      {spoilerExample.hidden}
    </span>
  );
}

/** The same problem during a review and after it's logged, showing what the spoiler rule hides. */
export function SpoilerExample() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
      <ExampleCard
        title={spoilerExample.whileReviewing}
        isRevealed={false}
        pattern={<Hidden />}
        insight={<Hidden />}
        solution={<Hidden />}
      />
      <ExampleCard
        title={spoilerExample.afterLogging}
        isRevealed
        pattern={<span className="font-medium">{spoilerExample.examplePattern}</span>}
        insight={<span className="italic">{spoilerExample.exampleInsight}</span>}
        solution={
          // An illustration of the revealed row, so the "link" is styled text with nowhere to go.
          <span className="inline-flex items-center gap-0.5 font-medium text-primary">
            {spoilerExample.open}
            <ArrowUpRightIcon aria-hidden className="size-3.5" />
          </span>
        }
      />
    </div>
  );
}
