import { CalendarIcon, ListIcon, SlidersHorizontalIcon } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router";

import { t } from "@/ui/shared/strings";

const NAV_LINKS = [
  { to: "/", label: t.nav.today, Icon: CalendarIcon },
  { to: "/problems", label: t.nav.problems, Icon: ListIcon },
  { to: "/settings", label: t.nav.settings, Icon: SlidersHorizontalIcon },
] as const;

// Below `sm` the same nav becomes a bottom bar, so there is only ever one nav landmark.
const NAV_CLASSES =
  "fixed inset-x-0 bottom-0 z-10 border-t bg-card sm:static sm:border-none sm:bg-transparent";
const NAV_LINK_CLASSES =
  "flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 border-transparent py-1.5 text-xs text-muted-foreground sm:flex-row sm:border-b-2 sm:py-0 sm:text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-[current=page]:font-semibold aria-[current=page]:text-foreground sm:flex-none sm:aria-[current=page]:border-primary";

/** The frame every main screen sits in: wordmark, nav and the current route below them. */
export function AppLayout() {
  return (
    <div className="mx-auto flex min-h-svh max-w-[640px] flex-col px-5">
      <header className="flex items-center justify-between py-4">
        <Link
          to="/"
          className="rounded-sm font-serif text-xl font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {t.appName}
        </Link>
        <nav aria-label={t.nav.label} className={NAV_CLASSES}>
          <ul className="flex sm:gap-5">
            {NAV_LINKS.map((link) => (
              <li key={link.to} className="flex flex-1">
                <NavLink to={link.to} end className={NAV_LINK_CLASSES}>
                  <link.Icon aria-hidden className="size-5 sm:hidden" />
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="flex-1 pb-24 sm:pb-8">
        <Outlet />
      </main>
    </div>
  );
}
