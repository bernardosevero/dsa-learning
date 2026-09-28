import type { ReactNode } from "react";
import { Link } from "react-router";

import { t } from "@/ui/strings";

export interface FocusFrameProps {
  /** Where the top-left link goes; Today unless the screen has a closer step back. */
  back?: { to: string; label: string };
  /** Shown top right, e.g. whether this is a review. */
  badge?: ReactNode;
  children: ReactNode;
}

/** Solving and Log replace the top bar with one way back, to keep the user on the problem. */
export function FocusFrame({ back, badge, children }: FocusFrameProps) {
  const link = back ?? { to: "/", label: t.solving.backToToday };
  return (
    <div className="mx-auto flex min-h-svh max-w-[640px] flex-col px-5">
      <header className="flex items-center justify-between gap-3 py-4">
        <Link
          to={link.to}
          className="flex min-h-11 items-center rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {link.label}
        </Link>
        {badge}
      </header>
      <main className="flex flex-1 flex-col gap-6 pb-8">{children}</main>
    </div>
  );
}
