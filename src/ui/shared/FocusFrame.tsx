import type { ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "@/ui/primitives/button";
import { t } from "@/ui/shared/strings";

import { PageSheet } from "./PageSheet";

export interface FocusFrameProps {
  /** Where the top-left link goes; Today unless the screen has a closer step back. */
  back?: { to: string; label: string };
  /** Shown top right, e.g. whether this is a review. */
  badge?: ReactNode;
  children: ReactNode;
}

/** Solving and Log replace the top bar with one way back, to keep the user on the problem. */
export function FocusFrame({ back, badge, children }: FocusFrameProps) {
  const link = back ?? { to: "/today", label: t.solving.backToToday };
  return (
    <PageSheet
      isReadable
      contentClassName="flex flex-col gap-6"
      header={
        <>
          <Button asChild variant="link" className="px-0 text-muted-foreground">
            <Link to={link.to}>{link.label}</Link>
          </Button>
          {badge}
        </>
      }
    >
      {children}
    </PageSheet>
  );
}
