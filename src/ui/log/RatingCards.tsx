import type { Rating } from "@/domain/types";
import { t } from "@/ui/strings";

import { RatingCard } from "./RatingCard";

const RATINGS = [
  { rating: "hard", shortcut: "1" },
  { rating: "medium", shortcut: "2" },
  { rating: "easy", shortcut: "3" },
] as const satisfies readonly { rating: Rating; shortcut: string }[];

export interface RatingCardsProps {
  value: Rating | null;
  onChange: (rating: Rating) => void;
  error?: string;
}

/** "How did it feel?": Hard, Medium or Easy, the only answer that drives the schedule. */
export function RatingCards({ value, onChange, error }: RatingCardsProps) {
  return (
    <fieldset aria-describedby={error === undefined ? undefined : "rating-error"}>
      <legend className="mb-3 font-semibold">{t.log.ratingLegend}</legend>
      <div className="flex flex-col gap-2">
        {RATINGS.map(({ rating, shortcut }) => (
          <RatingCard
            key={rating}
            rating={rating}
            shortcut={shortcut}
            isSelected={value === rating}
            onSelect={onChange}
          />
        ))}
      </div>
      {error !== undefined && (
        <p id="rating-error" role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
