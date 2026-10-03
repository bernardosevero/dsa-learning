import { CalendarIcon, ListIcon, SlidersHorizontalIcon } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";

import { PageSheet } from "@/ui/shared/PageSheet";
import { t } from "@/ui/shared/strings";

import { HeaderAccount } from "./HeaderAccount";

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
  /** Keeps a wide window's content to a readable column, for screens of text and forms. */
  isReadable?: boolean;
}

/** The frame every main screen sits in: wordmark, nav, account and the current route below. */
export function AppLayout({ isReadable }: AppLayoutProps) {
  return (
    <PageSheet
      isReadable={isReadable}
      header={
        <>
          <Link
            to="/"
            className="rounded-sm font-serif text-xl font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            {t.appName}
          </Link>
          {/* Tighter below the sheet width, where the nav and account share a narrow row. */}
          <div className="flex items-center gap-3 sheet:gap-5">
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
            <HeaderAccount />
          </div>
        </>
      }
    >
      <Outlet />
    </PageSheet>
  );
}
