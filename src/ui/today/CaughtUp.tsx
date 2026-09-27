import { CircleCheckBigIcon, CircleCheckIcon } from "lucide-react";
import { Link } from "react-router";

import { daysBetween } from "@/domain/dates";
import type { LocalDate } from "@/domain/types";
import { Button } from "@/ui/components/ui/button";
import { formatDate } from "@/ui/format";
import { t } from "@/ui/strings";

export interface CaughtUpProps {
  /** null when nothing is scheduled any more: every problem is mastered. */
  nextDue: LocalDate | null;
  todayDate: LocalDate;
}

/** Shown instead of the list when nothing is due and no new problem is left. */
export function CaughtUp({ nextDue, todayDate }: CaughtUpProps) {
  if (nextDue === null) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
        <CircleCheckBigIcon aria-hidden className="size-8 text-status-mastered" />
        <h2 className="font-serif text-2xl font-semibold">{t.today.everythingMastered}</h2>
        <p className="text-muted-foreground">{t.today.everythingMasteredDetail}</p>
        <Button asChild variant="outline" className="min-h-11 bg-card shadow-none">
          <Link to="/problems">{t.today.openProblems}</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
      <CircleCheckIcon aria-hidden className="size-8 text-primary" />
      <h2 className="font-serif text-2xl font-semibold">{t.today.caughtUp}</h2>
      <p className="text-muted-foreground">{t.today.caughtUpDetail}</p>
      <div className="mt-2 flex flex-col gap-1 rounded-xl bg-muted px-5 py-3">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t.today.nextReview}
        </span>
        <span className="font-mono">
          {formatDate(nextDue)}
          {t.separator}
          {t.today.inDays(daysBetween(todayDate, nextDue))}
        </span>
      </div>
    </div>
  );
}
