import type { Rating } from "@/domain/types";
import { cn } from "@/ui/lib/utils";

/** Each rating's colors and dot glyph, shared by the chip and the Log rating cards. */
export const RATING_STYLES: Record<
  Rating,
  { chip: string; text: string; selected: string; glyph: string }
> = {
  hard: {
    chip: "bg-rating-hard-muted text-rating-hard",
    text: "text-rating-hard",
    selected: "border-2 border-rating-hard bg-rating-hard-muted",
    glyph: "●●●",
  },
  medium: {
    chip: "bg-rating-medium-muted text-rating-medium",
    text: "text-rating-medium",
    selected: "border-2 border-rating-medium bg-rating-medium-muted",
    glyph: "●●○",
  },
  easy: {
    chip: "bg-rating-easy-muted text-rating-easy",
    text: "text-rating-easy",
    selected: "border-2 border-rating-easy bg-rating-easy-muted",
    glyph: "●○○",
  },
};

export interface RatingChipProps {
  rating: Rating;
  /** The words in the chip, e.g. "Hard" or "Hard · 2 days". Color is never the only signal. */
  label: string;
}

/** How an attempt felt: a colored pill with a dot glyph and its word. */
export function RatingChip({ rating, label }: RatingChipProps) {
  const style = RATING_STYLES[rating];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        style.chip,
      )}
    >
      <span aria-hidden className="tracking-tighter">
        {style.glyph}
      </span>
      {label}
    </span>
  );
}
