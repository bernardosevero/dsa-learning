import type { Rating } from "@/domain/types";
import { cn } from "@/ui/lib/utils";

const CHIP_STYLES: Record<Rating, { classes: string; glyph: string }> = {
  hard: { classes: "bg-rating-hard-muted text-rating-hard", glyph: "●●●" },
  medium: { classes: "bg-rating-medium-muted text-rating-medium", glyph: "●●○" },
  easy: { classes: "bg-rating-easy-muted text-rating-easy", glyph: "●○○" },
};

export interface RatingChipProps {
  rating: Rating;
  /** The words in the chip, e.g. "Hard" or "Hard · 2 days". Color is never the only signal. */
  label: string;
}

/** How an attempt felt: a colored pill with a dot glyph and its word. */
export function RatingChip({ rating, label }: RatingChipProps) {
  const style = CHIP_STYLES[rating];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        style.classes,
      )}
    >
      <span aria-hidden className="tracking-tighter">
        {style.glyph}
      </span>
      {label}
    </span>
  );
}
