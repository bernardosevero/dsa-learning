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
 * The frame of public pages, which render without the practice app: the wordmark and a link into
 * the app instead of the practice nav, so nothing here reads this browser's save.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <PageSheet
      isReadable
      header={
        <>
          <Wordmark />
          <nav aria-label={t.shell.publicNav}>
            <Button asChild variant="outline">
              <Link to="/">{t.shell.openApp}</Link>
            </Button>
          </nav>
        </>
      }
    >
      {children}
    </PageSheet>
  );
}
