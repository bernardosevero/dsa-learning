import { CircleCheckBigIcon, CircleCheckIcon } from "lucide-react";

import type { LocalDate } from "@/domain/types";
import { formatDate } from "@/ui/format";
import { t } from "@/ui/strings";

export interface CaughtUpProps {
  /** null when nothing is scheduled any more: every problem is mastered. */
  nextDue: LocalDate | null;
}

/** Shown instead of the list when nothing is due and no new problem is left. */
export function CaughtUp({ nextDue }: CaughtUpProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 text-center">
      {nextDue === null ? (
        <CircleCheckBigIcon aria-hidden className="size-8 text-status-mastered" />
      ) : (
        <CircleCheckIcon aria-hidden className="size-8 text-primary" />
      )}
      <p className="font-serif text-2xl font-semibold">
        {nextDue === null ? (
          t.today.everythingMastered
        ) : (
          <>
            {t.today.caughtUp} <span className="font-mono">{formatDate(nextDue)}</span>
          </>
        )}
      </p>
    </div>
  );
}
