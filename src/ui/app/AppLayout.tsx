import { CalendarIcon, ListIcon, SlidersHorizontalIcon } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";

import { PageSheet } from "@/ui/shared/PageSheet";
import { t } from "@/ui/shared/strings";

const NAV_LINKS = [
  { to: "/", label: t.nav.today, Icon: CalendarIcon },
  { to: "/problems", label: t.nav.problems, Icon: ListIcon },
  { to: "/settings", label: t.nav.settings, Icon: SlidersHorizontalIcon },
] as const;

// Below `nav` (phones) the same nav becomes a bottom bar, so there is only ever one nav landmark.
const NAV_CLASSES =
  "fixed inset-x-0 bottom-0 z-10 border-t bg-card nav:static nav:border-none nav:bg-transparent";
const NAV_LINK_CLASSES =
  "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 border-transparent py-1.5 text-xs text-muted-foreground nav:flex-row nav:border-b-2 nav:py-0 nav:text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:font-semibold aria-[current=page]:text-foreground nav:flex-none nav:aria-[current=page]:border-primary";

export interface AppLayoutProps {
  /** Lets the sheet widen on wide windows. Today turns it on with its sidebar (#76). */
  isWide?: boolean;
}

/** The frame every main screen sits in: wordmark, nav and the current route below them. */
export function AppLayout({ isWide }: AppLayoutProps) {
  return (
    <PageSheet
      isWide={isWide}
      mainClassName="pb-24 nav:pb-8"
      header={
        <>
          <Link
            to="/"
            className="rounded-sm font-serif text-xl font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {t.appName}
          </Link>
          <nav aria-label={t.nav.label} className={NAV_CLASSES}>
            <ul className="flex nav:gap-5">
              {NAV_LINKS.map((link) => (
                <li key={link.to} className="flex flex-1">
                  <NavLink to={link.to} end={link.to === "/"} className={NAV_LINK_CLASSES}>
                    <link.Icon aria-hidden className="size-5 nav:hidden" />
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </>
      }
    >
      <Outlet />
    </PageSheet>
  );
}
