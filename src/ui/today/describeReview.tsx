import type { ReactNode } from "react";

import type { DueReview } from "@/domain/today";
import { t } from "@/ui/strings";

/**
 * The line under a review's title: difficulty and how overdue, plus the pattern only when the
 * user opted in, since recognizing it is the exercise. Only the overdue count is set in mono.
 */
export function describeReview(review: DueReview, shouldShowPattern: boolean): ReactNode {
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
