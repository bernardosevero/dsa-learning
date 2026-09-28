import type { TopicGroup } from "@/domain/problemList";
import { cn } from "@/ui/primitives/cn";

const PERCENT = 100;

export interface TopicBarProps {
  topic: TopicGroup;
  /** Sizing and visibility; the bar itself is always 6px tall. */
  className?: string;
}

/** A topic's progress: mastered in plum, then the other started ones in green, over the rest. */
export function TopicBar({ topic, className }: TopicBarProps) {
  const masteredShare = (topic.mastered / topic.total) * PERCENT;
  const startedShare = ((topic.startedOrMastered - topic.mastered) / topic.total) * PERCENT;
  return (
    <span
      aria-hidden
      className={cn("flex h-1.5 shrink-0 overflow-hidden rounded-full bg-border", className)}
    >
      <span className="bg-status-mastered" style={{ width: `${masteredShare}%` }} />
      <span className="bg-primary" style={{ width: `${startedShare}%` }} />
    </span>
  );
}
