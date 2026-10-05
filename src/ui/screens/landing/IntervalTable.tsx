import { INTERVAL_DAYS } from "@/domain/schedule";
import type { Rating } from "@/domain/types";
import { Card } from "@/ui/primitives/card";
import { RatingChip } from "@/ui/shared/RatingChip";
import { t } from "@/ui/shared/strings";

const RATINGS: readonly Rating[] = ["hard", "medium", "easy"];

/** The fixed schedule as a table: each rating and how many calendar days until its re-solve. */
export function IntervalTable() {
  return (
    <Card className="p-4">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{t.landing.intervalsCaption}</caption>
        <thead>
          <tr className="border-b text-muted-foreground">
            <th scope="col" className="pb-2 font-medium">
              {t.landing.intervalsColumns.rating}
            </th>
            <th scope="col" className="pb-2 font-medium">
              {t.landing.intervalsColumns.next}
            </th>
          </tr>
        </thead>
        <tbody>
          {RATINGS.map((rating) => (
            <tr key={rating} className="border-b last:border-b-0">
              <th scope="row" className="py-2.5 font-normal">
                <RatingChip rating={rating} label={t.ratings[rating]} />
              </th>
              <td className="py-2.5 font-mono">{t.landing.intervalDays(INTERVAL_DAYS[rating])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
