import type { TodayView } from "@/domain/today";

import { DueReviews } from "./DueReviews";
import { NextNewProblem } from "./NextNewProblem";

export interface TodayListProps {
  view: Extract<TodayView, { kind: "list" }>;
  shouldShowPattern: boolean;
}

/** The due reviews, then the next new problem, which becomes the focus when nothing is due. */
export function TodayList({ view, shouldShowPattern }: TodayListProps) {
  return (
    <>
      <DueReviews
        reviews={view.reviews}
        estimateMinutes={view.estimateMinutes}
        shouldShowPattern={shouldShowPattern}
      />
      {view.nextNew !== null && view.newTopic !== null && (
        <NextNewProblem
          problem={view.nextNew}
          topic={view.newTopic}
          isFocus={view.reviews.length === 0}
        />
      )}
    </>
  );
}
