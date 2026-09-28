import { CircleCheckBigIcon } from "lucide-react";

import { t } from "@/ui/strings";

export interface MasteredCardProps {
  masteredCount: number;
  total: number;
}

/** The problem left the rotation. Quiet on purpose: no animation. */
export function MasteredCard({ masteredCount, total }: MasteredCardProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
      <span className="rounded-full border-2 border-status-mastered p-1.5">
        <CircleCheckBigIcon aria-hidden className="size-8 text-status-mastered" />
      </span>
      <p className="text-sm font-semibold tracking-widest text-status-mastered uppercase">
        {t.log.mastered}
      </p>
      <p className="text-muted-foreground">{t.log.masteredDetail}</p>
      <p className="font-mono text-sm">{t.log.masteredCount(masteredCount, total)}</p>
    </div>
  );
}
