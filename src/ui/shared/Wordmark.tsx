import { Link } from "react-router";

import { t } from "./strings";

export interface WordmarkProps {
  /** Where the name leads: Today in the practice app, the home page on public pages. */
  to: "/today" | "/";
}

/** The product name in a sheet's header, linking to the start of the part of the site it's in. */
export function Wordmark({ to }: WordmarkProps) {
  return (
    <Link
      to={to}
      className="rounded-sm font-serif text-xl font-semibold whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {t.appName}
    </Link>
  );
}
