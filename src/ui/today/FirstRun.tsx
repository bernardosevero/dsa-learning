import { Link } from "react-router";

import { INTERVAL_DAYS } from "@/domain/schedule";
import type { Problem, Rating } from "@/domain/types";
import { RatingChip } from "@/ui/components/RatingChip";
import { t } from "@/ui/strings";

import { FocusCard } from "./FocusCard";

const RATINGS: readonly Rating[] = ["hard", "medium", "easy"];
const LINK_CLASSES = "text-sm text-primary underline-offset-4 hover:underline";

function describeInterval(rating: Rating): string {
  return `${t.ratings[rating]}${t.separator}${t.today.intro.interval(INTERVAL_DAYS[rating])}`;
}

export interface FirstRunProps {
  firstProblem: Problem;
}

/** Today before anything is logged: what the app does, then the first problem. */
export function FirstRun({ firstProblem }: FirstRunProps) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-semibold">{t.today.intro.title}</h2>
        <p className="text-muted-foreground">{t.today.intro.summary}</p>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
        <ol className="flex flex-col gap-3">
          {t.today.intro.steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="font-mono text-muted-foreground">{index + 1}</span>
              {step}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap gap-2 pl-6">
          {RATINGS.map((rating) => (
            <RatingChip key={rating} rating={rating} label={describeInterval(rating)} />
          ))}
        </div>
      </div>
      <FocusCard
        label={t.today.firstProblem}
        problem={firstProblem}
        meta={`${firstProblem.pattern}${t.separator}${firstProblem.difficulty}`}
      />
      <div className="flex flex-col gap-2">
        <Link to="/problems" className={LINK_CLASSES}>
          {t.today.intro.markSolved}
        </Link>
        <Link to="/settings" className={LINK_CLASSES}>
          {t.today.intro.importData}
        </Link>
      </div>
    </>
  );
}
