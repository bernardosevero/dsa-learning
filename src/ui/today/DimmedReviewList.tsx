import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import type { DueReview } from "@/domain/today";
import { t } from "@/ui/strings";

import { DimmedReviewRow } from "./DimmedReviewRow";
import { describeReview } from "./describeReview";

/** Past the focus, a big backlog shows this many rows until the user asks for the rest. */
export const VISIBLE_BACKLOG_ROWS = 5;

export interface DimmedReviewListProps {
  /** The due reviews after the focus, in order. */
  reviews: readonly DueReview[];
  shouldShowPattern: boolean;
}

/** The due reviews after the focus, collapsed past a few rows so a backlog stays calm. */
export function DimmedReviewList({ reviews, shouldShowPattern }: DimmedReviewListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleReviews = isExpanded ? reviews : reviews.slice(0, VISIBLE_BACKLOG_ROWS);
  const hiddenCount = reviews.length - visibleReviews.length;
  if (reviews.length === 0) {
    return null;
  }
  return (
    <>
      <ul>
        {visibleReviews.map((review) => (
          <DimmedReviewRow
            key={review.problem.id}
            problem={review.problem}
            meta={describeReview(review, shouldShowPattern)}
          />
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {t.today.showOthers(hiddenCount)}
          <ChevronDownIcon aria-hidden className="size-4" />
        </button>
      )}
    </>
  );
}
