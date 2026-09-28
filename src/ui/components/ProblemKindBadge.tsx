import { cn } from "@/ui/lib/utils";
import { t } from "@/ui/strings";

export interface ProblemKindBadgeProps {
  isReview: boolean;
  isPatternHidden: boolean;
}

/** Tells the user whether this is a review (pattern hidden) or a new problem. */
export function ProblemKindBadge({ isReview, isPatternHidden }: ProblemKindBadgeProps) {
  const reviewLabel = isPatternHidden ? t.solving.reviewBadge : t.solving.reviewBadgePatternShown;
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isReview ? "bg-status-due-muted text-status-due" : "border text-muted-foreground",
      )}
    >
      {isReview ? reviewLabel : t.solving.newBadge}
    </span>
  );
}
