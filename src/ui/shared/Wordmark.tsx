import { RefreshCwIcon } from "lucide-react";
import { Link } from "react-router";

import { cn } from "@/ui/primitives/cn";

import { t } from "./strings";

export interface WordmarkProps {
  /** Where the name leads: Today in the practice app, the home page on public pages. */
  to: "/today" | "/";
  /** Shows the repeat mark before the name, as the public header does. */
  hasIcon?: boolean;
}

/** The product name in a sheet's header, linking to the start of the part of the site it's in. */
export function Wordmark({ to, hasIcon = false }: WordmarkProps) {
  return (
    <Link
      to={to}
      className={cn(
        "rounded-sm font-serif text-xl font-semibold whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        // The public header has room for a full 44px target; practice headers keep their height.
        hasIcon && "inline-flex min-h-11 items-center gap-2",
      )}
    >
      {hasIcon && <RefreshCwIcon aria-hidden className="size-[22px] text-primary" />}
      {t.appName}
    </Link>
  );
}
