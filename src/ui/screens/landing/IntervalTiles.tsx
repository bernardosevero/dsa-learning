import { INTERVAL_DAYS } from "@/domain/schedule";
import type { Rating } from "@/domain/types";
import { cn } from "@/ui/primitives/cn";
import { RATING_STYLES } from "@/ui/shared/RatingChip";
import { t } from "@/ui/shared/strings";

const RATINGS: readonly Rating[] = ["hard", "medium", "easy"];

const TILE_BACKGROUNDS: Record<Rating, string> = {
  hard: "bg-rating-hard-muted",
  medium: "bg-rating-medium-muted",
  easy: "bg-rating-easy-muted",
};

/** The fixed schedule as three big tiles: each rating, its dots and word, and the days until it returns. */
export function IntervalTiles() {
  return (
    <ul className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      {RATINGS.map((rating) => (
        <li
          key={rating}
          className={cn("flex flex-col gap-1.5 rounded-xl px-6 py-5.5", TILE_BACKGROUNDS[rating])}
        >
          <span
            className={cn(
              "inline-flex items-center gap-2 font-semibold",
              RATING_STYLES[rating].text,
            )}
          >
            <span aria-hidden className="text-xs tracking-tighter">
              {RATING_STYLES[rating].glyph}
            </span>
            {t.landing.felt[rating]}
          </span>
          <span className="font-mono text-[52px] leading-none font-medium">
            {INTERVAL_DAYS[rating]}
            <span className="ml-2 text-lg text-muted-foreground">{t.landing.days}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
