import { CheckIcon, ChevronDownIcon, ClockIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import type { DueReview } from "@/domain/today";
import { Alert, AlertDescription } from "@/ui/primitives/alert";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { formatEstimate } from "@/ui/shared/format";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { StartLink } from "@/ui/shared/StartLink";
import { t } from "@/ui/shared/strings";

import { FocusCard } from "./FocusCard";

const HEADING_ID = "due-reviews-heading";
/** Past the focus, a big backlog shows this many rows until the user asks for the rest. */
const VISIBLE_BACKLOG_ROWS = 5;

/**
 * The line under a review's title: difficulty and how overdue, plus the pattern only when the
 * user opted in, since recognizing it is the exercise. Only the overdue count is set in mono.
 */
function describeReview(review: DueReview, shouldShowPattern: boolean): ReactNode {
  const overdue =
    review.daysOverdue === 0 ? t.today.dueToday : t.today.daysOverdue(review.daysOverdue);
  const details = shouldShowPattern
    ? [review.problem.pattern, review.problem.difficulty]
    : [review.problem.difficulty];
  return (
    <>
      {details.join(t.separator)}
      {t.separator}
      <span className="font-mono">{overdue}</span>
    </>
  );
}

export interface DueReviewsProps {
  /** Sorted by risk; may be empty. */
  reviews: readonly DueReview[];
  estimateMinutes: number;
  shouldShowPattern: boolean;
}

/** Today's due reviews: the first as the focus card, the rest as dimmed rows. */
export function DueReviews({ reviews, estimateMinutes, shouldShowPattern }: DueReviewsProps) {
  const [focus, ...others] = reviews;
  const estimate = focus !== undefined && (
    <span className="font-mono text-sm text-muted-foreground">
      {formatEstimate(estimateMinutes)}
    </span>
  );
  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-3">
      <SectionLabel id={HEADING_ID} aside={estimate}>
        {t.today.dueReviews}
        {t.separator}
        <span className="font-mono">{reviews.length}</span>
      </SectionLabel>
      {/* Keeps the section in place on a day with no reviews, pointing to the new problem. */}
      {focus === undefined && (
        <Card className="flex-row items-center gap-3 border-dashed bg-transparent p-4 text-sm text-muted-foreground">
          <CheckIcon aria-hidden className="size-4 shrink-0" />
          <p>{t.today.nothingDue}</p>
        </Card>
      )}
      {others.length > VISIBLE_BACKLOG_ROWS && (
        <Alert>
          <ClockIcon aria-hidden />
          <AlertDescription>{t.today.backlogNote}</AlertDescription>
        </Alert>
      )}
      {focus !== undefined && (
        <FocusCard
          label={t.today.focus}
          problem={focus.problem}
          meta={describeReview(focus, shouldShowPattern)}
        />
      )}
      {others.length > 0 && (
        <DimmedReviews reviews={others} shouldShowPattern={shouldShowPattern} />
      )}
    </section>
  );
}

interface DimmedReviewsProps {
  /** The due reviews after the focus, in order. */
  reviews: readonly DueReview[];
  shouldShowPattern: boolean;
}

/**
 * The due reviews after the focus, collapsed past a few rows so a backlog stays calm. Dimmed with
 * muted text rather than opacity, so the rows keep their contrast.
 */
function DimmedReviews({ reviews, shouldShowPattern }: DimmedReviewsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleReviews = isExpanded ? reviews : reviews.slice(0, VISIBLE_BACKLOG_ROWS);
  const hiddenCount = reviews.length - visibleReviews.length;
  return (
    <>
      <ul>
        {visibleReviews.map((review) => (
          <li
            key={review.problem.id}
            className="flex items-center justify-between gap-4 border-b py-3 pl-5 text-muted-foreground"
          >
            <div className="flex min-w-0 flex-col">
              <p>{review.problem.title}</p>
              <p className="text-sm">{describeReview(review, shouldShowPattern)}</p>
            </div>
            <StartLink problem={review.problem} variant="muted" />
          </li>
        ))}
      </ul>
      {hiddenCount > 0 && (
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(true)}
          className="rounded-xl border-dashed bg-transparent font-normal text-muted-foreground"
        >
          {t.today.showOthers(hiddenCount)}
          <ChevronDownIcon aria-hidden />
        </Button>
      )}
    </>
  );
}
