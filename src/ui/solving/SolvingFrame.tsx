import type { ReactNode } from "react";
import { Link } from "react-router";

import { t } from "@/ui/strings";

export interface SolvingFrameProps {
  /** Shown top right, e.g. whether this is a review. */
  badge?: ReactNode;
  children: ReactNode;
}

/** Solving replaces the top bar with a way back to Today, to keep the user on the problem. */
export function SolvingFrame({ badge, children }: SolvingFrameProps) {
  return (
    <div className="mx-auto flex min-h-svh max-w-[640px] flex-col px-5">
      <header className="flex items-center justify-between gap-3 py-4">
        <Link
          to="/"
          className="flex min-h-11 items-center rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {t.solving.backToToday}
        </Link>
        {badge}
      </header>
      <main className="flex flex-1 flex-col gap-6 pb-8">{children}</main>
    </div>
  );
}
