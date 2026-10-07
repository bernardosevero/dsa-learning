import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

import { setAnalyticsEnabled, trackAppOpened, trackPageView } from "@/ui/shared/analytics";
import { useUsageSharing } from "@/ui/shared/useUsageSharing";

const PRACTICE_PATH_PREFIXES = ["/today", "/problems", "/settings", "/solve/", "/log/"] as const;

function isPracticePath(pathname: string): boolean {
  return PRACTICE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Pageviews across public and practice pages, and app_opened on the first practice page, from one
 * place above both: it reads the shared usage choice, not the practice save, and sends nothing
 * until that choice has been read.
 */
export function AnalyticsRouteTracker() {
  const { isEnabled } = useUsageSharing();
  const { pathname } = useLocation();
  // The last path sent, so a preference change or an effect replay never repeats a pageview.
  const lastTrackedPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (isEnabled === undefined) {
      return;
    }
    setAnalyticsEnabled(isEnabled);
    if (!isEnabled || lastTrackedPath.current === pathname) {
      return;
    }
    lastTrackedPath.current = pathname;
    trackPageView(pathname);
    if (isPracticePath(pathname)) {
      trackAppOpened();
    }
  }, [isEnabled, pathname]);

  return null;
}
