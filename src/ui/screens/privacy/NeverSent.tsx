import { XIcon } from "lucide-react";

import { t } from "@/ui/shared/strings";

/** What analytics never carries, in a box of its own so it isn't lost in the list of what it does. */
export function NeverSent() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-foreground px-6 py-5.5 text-background">
      <p className="font-semibold">{t.privacy.neverSentTitle}</p>
      <ul className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-x-5 gap-y-2 text-[15px]">
        {t.privacy.neverSent.map((item) => (
          <li key={item} className="flex items-center gap-2">
            <XIcon aria-hidden className="size-3.5 text-destructive" strokeWidth={2.4} />
            {item}
          </li>
        ))}
      </ul>
      <p className="text-sm opacity-85">{t.privacy.neverCollected}</p>
    </div>
  );
}
