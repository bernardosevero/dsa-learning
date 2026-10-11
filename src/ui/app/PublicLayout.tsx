import type { ReactNode } from "react";
import { NavLink } from "react-router";

import { Button } from "@/ui/primitives/button";
import { SiteFooter } from "@/ui/shared/SiteFooter";
import { t } from "@/ui/shared/strings";
import { Wordmark } from "@/ui/shared/Wordmark";

import { PublicSiteLinks } from "./PublicSiteLinks";

export interface PublicLayoutProps {
  children: ReactNode;
}

/**
 * The frame of public pages, which render without the practice app: a full-width header with the
 * wordmark home, How it works and a link into the app, then the page's own sections, the site
 * links and the author footer. Nothing here reads the save.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    // The body shows the desk colour around practice sheets; public pages cover it edge to edge.
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-3 px-[clamp(16px,4vw,40px)] py-3.5">
          <Wordmark to="/" hasIcon />
          <nav aria-label={t.shell.publicNav} className="flex flex-wrap items-center gap-1">
            <Button asChild variant="ghost" className="px-3 aria-[current=page]:bg-secondary">
              <NavLink to="/how-it-works">{t.shell.howItWorks}</NavLink>
            </Button>
            <Button asChild variant="outline" className="ml-1.5">
              <NavLink to="/today">{t.shell.openApp}</NavLink>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <PublicSiteLinks />
      <SiteFooter />
    </div>
  );
}
