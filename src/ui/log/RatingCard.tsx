import { INTERVAL_DAYS } from "@/domain/schedule";
import type { Rating } from "@/domain/types";
import { RATING_STYLES } from "@/ui/components/RatingChip";
import { cn } from "@/ui/lib/utils";
import { t } from "@/ui/strings";

export interface RatingCardProps {
  rating: Rating;
  shortcut: string;
  isSelected: boolean;
  onSelect: (rating: Rating) => void;
}

/** One rating as a radio card: glyph and word, interval, shortcut, and the anchor text. */
export function RatingCard({ rating, shortcut, isSelected, onSelect }: RatingCardProps) {
  const style = RATING_STYLES[rating];
  return (
    <label
      className={cn(
        "grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 rounded-xl border bg-card p-4 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50",
        isSelected && style.selected,
      )}
    >
      <input
        type="radio"
        name="rating"
        value={rating}
        checked={isSelected}
        onChange={() => onSelect(rating)}
        className="outline-none"
      />
      <span className={cn("font-semibold", style.text)}>
        <span aria-hidden className="mr-1.5 tracking-tighter">
          {style.glyph}
        </span>
        {t.ratings[rating]}
      </span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{t.log.intervalDays(INTERVAL_DAYS[rating])}</span>
        <kbd className="rounded border px-1.5 font-mono">{shortcut}</kbd>
      </span>
      <span className="col-span-2 col-start-2 text-sm text-muted-foreground">
        {t.log.anchors[rating]}
      </span>
    </label>
  );
}
