import { Badge } from "@/ui/primitives/badge";
import { t } from "@/ui/shared/strings";

export interface ProblemKindBadgeProps {
  isReview: boolean;
  isPatternHidden: boolean;
}

/** Tells the user whether this is a review (pattern hidden unless opted in) or a new problem. */
export function ProblemKindBadge({ isReview, isPatternHidden }: ProblemKindBadgeProps) {
  if (!isReview) {
    return <Badge variant="outline">{t.solving.newBadge}</Badge>;
  }
  return (
    <Badge variant="due">
      {isPatternHidden ? t.solving.reviewBadge : t.solving.reviewBadgePatternShown}
    </Badge>
  );
}
