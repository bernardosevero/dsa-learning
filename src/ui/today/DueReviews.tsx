import { ClockIcon } from "lucide-react";

import type { DueReview } from "@/domain/today";
import { NoteBox } from "@/ui/components/NoteBox";
import { SectionLabel } from "@/ui/components/SectionLabel";
import { formatEstimate } from "@/ui/format";
import { t } from "@/ui/strings";

import { describeReview } from "./describeReview";
import { DimmedReviewList, VISIBLE_BACKLOG_ROWS } from "./DimmedReviewList";
import { FocusCard } from "./FocusCard";
import { NothingDue } from "./NothingDue";

const HEADING_ID = "due-reviews-heading";

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
      {focus === undefined && <NothingDue />}
      {others.length > VISIBLE_BACKLOG_ROWS && (
        <NoteBox Icon={ClockIcon}>{t.today.backlogNote}</NoteBox>
      )}
      {focus !== undefined && (
        <FocusCard
          label={t.today.focus}
          problem={focus.problem}
          meta={describeReview(focus, shouldShowPattern)}
        />
      )}
      <DimmedReviewList reviews={others} shouldShowPattern={shouldShowPattern} />
    </section>
  );
}
