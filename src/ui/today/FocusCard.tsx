import type { ReactNode } from "react";

import type { Problem } from "@/domain/types";
import { StartLink } from "@/ui/components/StartLink";

export interface FocusCardProps {
  /** e.g. "★ Focus · most at risk" or "★ Up next". */
  label: string;
  problem: Problem;
  meta: ReactNode;
}

/** The one obvious next action on Today, marked ★. */
export function FocusCard({ label, problem, meta }: FocusCardProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border-[1.5px] border-primary bg-card p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">{label}</p>
        <p className="font-serif text-2xl font-semibold">{problem.title}</p>
        <p className="text-sm text-muted-foreground">{meta}</p>
      </div>
      <StartLink problem={problem} variant="primary" />
    </div>
  );
}
