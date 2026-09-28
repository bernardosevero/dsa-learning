import type { Rating } from "@/domain/types";
import { Badge } from "@/ui/components/ui/badge";

/** Each rating's dot glyph, text color and selected-card style, shared with the Log rating cards. */
export const RATING_STYLES: Record<Rating, { glyph: string; text: string; selected: string }> = {
  hard: {
    glyph: "●●●",
    text: "text-rating-hard",
    selected: "border-2 border-rating-hard bg-rating-hard-muted",
  },
  medium: {
    glyph: "●●○",
    text: "text-rating-medium",
    selected: "border-2 border-rating-medium bg-rating-medium-muted",
  },
  easy: {
    glyph: "●○○",
    text: "text-rating-easy",
    selected: "border-2 border-rating-easy bg-rating-easy-muted",
  },
};

export interface RatingChipProps {
  rating: Rating;
  /** The words in the chip, e.g. "Hard" or "Hard · 2 days". Color is never the only signal. */
  label: string;
}

/** How an attempt felt: a Badge in the rating's colors with its dot glyph and word. */
export function RatingChip({ rating, label }: RatingChipProps) {
  return (
    <Badge variant={rating}>
      <span aria-hidden className="tracking-tighter">
        {RATING_STYLES[rating].glyph}
      </span>
      {label}
    </Badge>
  );
}
