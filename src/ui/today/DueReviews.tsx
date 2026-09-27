import type { DueReview } from "@/domain/today";
import { SectionLabel } from "@/ui/components/SectionLabel";
import { formatEstimate } from "@/ui/format";
import { t } from "@/ui/strings";

import { DimmedReviewRow } from "./DimmedReviewRow";
import { FocusReviewCard } from "./FocusReviewCard";

const HEADING_ID = "due-reviews-heading";

// The pattern stays hidden on reviews unless the user opted in: recognizing it is the exercise.
function describeReview(review: DueReview, shouldShowPattern: boolean): string {
  const overdue =
    review.daysOverdue === 0 ? t.today.dueToday : t.today.daysOverdue(review.daysOverdue);
  const parts = [review.problem.difficulty, overdue];
  return (shouldShowPattern ? [review.problem.pattern, ...parts] : parts).join(t.separator);
}

export interface DueReviewsProps {
  /** Sorted by risk; never empty. */
  reviews: readonly DueReview[];
  estimateMinutes: number;
  shouldShowPattern: boolean;
}

/** Today's due reviews: the first as the focus card, the rest as dimmed rows. */
export function DueReviews({ reviews, estimateMinutes, shouldShowPattern }: DueReviewsProps) {
  const [focus, ...others] = reviews;
  if (focus === undefined) {
    return null;
  }
  return (
    <section aria-labelledby={HEADING_ID}>
      <SectionLabel
        id={HEADING_ID}
        aside={
          <span className="font-mono text-sm text-muted-foreground">
            {formatEstimate(estimateMinutes)}
          </span>
        }
      >
        {t.today.dueReviews}
        {t.separator}
        <span className="font-mono">{reviews.length}</span>
      </SectionLabel>
      <FocusReviewCard problem={focus.problem} meta={describeReview(focus, shouldShowPattern)} />
      {others.length > 0 && (
        <ul>
          {others.map((review) => (
            <DimmedReviewRow
              key={review.problem.id}
              problem={review.problem}
              meta={describeReview(review, shouldShowPattern)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
