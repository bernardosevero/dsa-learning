import { CalendarIcon, CircleCheckIcon, CircleIcon } from "lucide-react";

import type { ProblemStatus } from "@/domain/problemList";
import { Badge } from "@/ui/primitives/badge";
import { t } from "@/ui/shared/strings";

const BADGE_VARIANTS = {
  new: "outline",
  scheduled: "muted",
  due: "due",
  mastered: "mastered",
} as const satisfies Record<ProblemStatus, string>;

export interface StatusBadgeProps {
  status: ProblemStatus;
}

/** New · Scheduled · Due · Mastered, each with its own icon so color is never the only signal. */
export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={BADGE_VARIANTS[status]}>
      <StatusIcon status={status} />
      {t.problems.statuses[status]}
    </Badge>
  );
}

function StatusIcon({ status }: StatusBadgeProps) {
  switch (status) {
    case "new":
      return <CircleIcon aria-hidden />;
    case "scheduled":
      return <CalendarIcon aria-hidden />;
    case "due":
      return <CircleIcon aria-hidden className="fill-current" />;
    case "mastered":
      return <CircleCheckIcon aria-hidden />;
  }
}
