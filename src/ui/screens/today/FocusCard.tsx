import type { ReactNode } from "react";

import type { Problem } from "@/domain/types";
import { Overline } from "@/ui/shared/Overline";
import { StartLink } from "./StartLink";
import { Card } from "@/ui/primitives/card";

export interface FocusCardProps {
  /** e.g. "★ Focus · most at risk" or "★ Up next". */
  label: string;
  problem: Problem;
  meta: ReactNode;
}

/** The one obvious next action on Today, marked ★. */
export function FocusCard({ label, problem, meta }: FocusCardProps) {
  return (
    <Card className="flex-row items-center justify-between gap-4 border-[1.5px] border-primary p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <Overline className="text-primary">{label}</Overline>
        <p className="font-serif text-2xl font-semibold">{problem.title}</p>
        <p className="text-sm text-muted-foreground">{meta}</p>
      </div>
      <StartLink problem={problem} variant="primary" />
    </Card>
  );
}
