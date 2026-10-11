import { INTERVAL_DAYS } from "@/domain/schedule";
import type { Rating } from "@/domain/types";
import { Card } from "@/ui/primitives/card";
import { cn } from "@/ui/primitives/cn";
import { t } from "@/ui/shared/strings";

const { riskExample } = t.howItWorks;

const PERCENT = 100;

interface ExampleReview {
  title: string;
  lastRating: Rating;
  daysOverdue: number;
}

// Listed oldest first on purpose: the table orders them by risk, as Today does.
const EXAMPLE_REVIEWS: readonly ExampleReview[] = [
  { title: riskExample.problems.climbingStairs, lastRating: "easy", daysOverdue: 6 },
  { title: riskExample.problems.validParentheses, lastRating: "medium", daysOverdue: 3 },
  { title: riskExample.problems.containsDuplicate, lastRating: "hard", daysOverdue: 2 },
];

// Today's rule (src/domain/today.ts): days overdue measured against the last rating's interval.
function toRiskPercent(review: ExampleReview): number {
  return Math.round((review.daysOverdue / INTERVAL_DAYS[review.lastRating]) * PERCENT);
}

function compareByRisk(a: ExampleReview, b: ExampleReview): number {
  return toRiskPercent(b) - toRiskPercent(a);
}

/** Three example reviews ordered by risk, showing why the oldest isn't always first. */
export function RiskExample() {
  const reviews = EXAMPLE_REVIEWS.toSorted(compareByRisk);

  return (
    <Card className="p-5">
      <figure className="flex flex-col gap-3">
        <figcaption className="text-sm font-semibold">{riskExample.caption}</figcaption>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="pr-3 pb-2 font-medium">
                  {riskExample.columns.review}
                </th>
                <th scope="col" className="pr-3 pb-2 font-medium">
                  {riskExample.columns.interval}
                </th>
                <th scope="col" className="pr-3 pb-2 font-medium">
                  {riskExample.columns.overdue}
                </th>
                <th scope="col" className="pb-2 font-medium">
                  {riskExample.columns.risk}
                </th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review, index) => (
                <RiskRow key={review.title} review={review} isFocus={index === 0} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground">{riskExample.footnote}</p>
      </figure>
    </Card>
  );
}

interface RiskRowProps {
  review: ExampleReview;
  isFocus: boolean;
}

function RiskRow({ review, isFocus }: RiskRowProps) {
  const riskPercent = toRiskPercent(review);

  return (
    <tr className="border-b last:border-b-0">
      <th scope="row" className={cn("py-2.5 pr-3", isFocus ? "font-semibold" : "font-medium")}>
        {isFocus && (
          <span role="img" aria-label={riskExample.focus} className="mr-1 text-primary">
            ★
          </span>
        )}
        {review.title}
      </th>
      <td className="py-2.5 pr-3 font-mono">
        {riskExample.days(INTERVAL_DAYS[review.lastRating])}
      </td>
      <td className="py-2.5 pr-3 font-mono">{riskExample.days(review.daysOverdue)}</td>
      <td className="py-2.5">
        <div className="flex items-center gap-2.5">
          <div aria-hidden className="h-1.5 max-w-[120px] flex-1 rounded-full bg-secondary">
            {/* The bar's length is data, so it can't be a fixed utility class. */}
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${Math.min(riskPercent, PERCENT)}%` }}
            />
          </div>
          <span className="font-mono">{riskExample.percent(riskPercent)}</span>
        </div>
      </td>
    </tr>
  );
}
