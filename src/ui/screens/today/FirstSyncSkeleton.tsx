import { Skeleton } from "@/ui/primitives/skeleton";
import { t } from "@/ui/shared/strings";

/** Stands in for Today while the account's first sync brings the log to an empty browser. */
export function FirstSyncSkeleton() {
  return (
    <div role="status" aria-busy className="flex flex-col gap-7">
      <span className="sr-only">{t.today.intro.loading}</span>
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-36 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}
