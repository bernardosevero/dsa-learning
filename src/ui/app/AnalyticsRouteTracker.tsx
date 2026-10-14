import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { setAnalyticsEnabled, trackAppOpened, trackPageView } from "@/ui/shared/analytics";
import { useUsageConsent } from "@/ui/shared/useUsageConsent";

const PRACTICE_PATH_PREFIXES = ["/today", "/problems", "/settings", "/solve/", "/log/"] as const;

function isPracticePath(pathname: string): boolean {
  return PRACTICE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Pageviews across public and practice pages, and app_opened on the first practice page, from one
 * place above both: it reads this browser's consent, not the practice save, and sends nothing
 * until the visitor has accepted.
 */
export function AnalyticsRouteTracker() {
  const { consent } = useUsageConsent();
  const { pathname } = useLocation();
  // The last path sent, so a consent change or an effect replay never repeats a pageview.
  const lastTrackedPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (consent === undefined) {
      return;
    }
    const isEnabled = consent === "accepted";
    setAnalyticsEnabled(isEnabled);
    if (!isEnabled || lastTrackedPath.current === pathname) {
      return;
    }
    lastTrackedPath.current = pathname;
    trackPageView(pathname);
    if (isPracticePath(pathname)) {
      trackAppOpened();
    }
  }, [consent, pathname]);

  return null;
}
