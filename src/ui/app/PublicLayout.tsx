import type { ReactNode } from "react";
import { Link } from "react-router";

import { Button } from "@/ui/primitives/button";
import { PageSheet } from "@/ui/shared/PageSheet";
import { t } from "@/ui/shared/strings";
import { Wordmark } from "@/ui/shared/Wordmark";

export interface PublicLayoutProps {
  children: ReactNode;
}

/**
 * The frame of public pages, which render without the practice app: the wordmark home, How it
 * works and a link into the app instead of the practice nav, so nothing here reads the save.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <PageSheet
      isReadable
      header={
        <>
          <Wordmark to="/" />
          <nav
            aria-label={t.shell.publicNav}
            className="flex flex-wrap items-center justify-end gap-0.5 nav:gap-3"
          >
            <Button asChild variant="ghost" className="px-2 nav:px-3">
              <Link to="/how-it-works">{t.shell.howItWorks}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/today">{t.shell.openApp}</Link>
            </Button>
          </nav>
        </>
      }
    >
      {children}
    </PageSheet>
  );
}
