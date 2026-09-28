import { daysBetween } from "@/domain/dates";
import type { LocalDate } from "@/domain/types";
import { formatDate } from "@/ui/format";
import { t } from "@/ui/strings";

export interface NextResolveCardProps {
  dueDate: LocalDate;
  todayDate: LocalDate;
}

/** When the problem comes back, from the schedule the new attempt produced. */
export function NextResolveCard({ dueDate, todayDate }: NextResolveCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border bg-card p-5">
      <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {t.log.nextResolve(dueDate)}
      </p>
      <p className="font-mono text-3xl">{formatDate(dueDate)}</p>
      <p className="font-mono text-sm text-muted-foreground">
        {t.today.inDays(daysBetween(todayDate, dueDate))}
      </p>
    </div>
  );
}
