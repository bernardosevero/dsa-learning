import { Link } from "react-router";

import { t } from "./strings";

/** The product name in a sheet's header, linking to the app's start. */
export function Wordmark() {
  return (
    <Link
      to="/"
      className="rounded-sm font-serif text-xl font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {t.appName}
    </Link>
  );
}
