import { cn } from "@/ui/primitives/cn";

export interface TopicProgressProps {
  done: number;
  total: number;
}

/** One small bar per problem in the topic, the done ones filled, then "2/6". */
export function TopicProgress({ done, total }: TopicProgressProps) {
  const segments = Array.from({ length: total }, (_slot, index) => index < done);
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5" aria-hidden>
        {segments.map((isDone, index) => (
          <span
            key={index}
            className={cn("h-1.5 w-3.5 rounded-sm", isDone ? "bg-primary" : "bg-border")}
          />
        ))}
      </div>
      <span className="font-mono text-sm text-muted-foreground">
        {done}/{total}
      </span>
    </div>
  );
}
