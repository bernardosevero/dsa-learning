import { CheckIcon } from "lucide-react";

import { t } from "@/ui/strings";

/** Keeps the Due section in place on a day with no reviews, pointing to the new problem. */
export function NothingDue() {
  return (
    <p className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
      <CheckIcon aria-hidden className="size-4 shrink-0" />
      {t.today.nothingDue}
    </p>
  );
}
