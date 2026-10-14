import { lazy, Suspense } from "react";

import { isAnalyticsConfigured } from "@/ui/shared/analytics";
import { useUsageConsent } from "@/ui/shared/useUsageConsent";

// Its code (and the primitives and strings it brings) loads only when there's something to ask,
// so every page's first paint downloads the same bundle with or without the banner.
const ConsentBanner = lazy(() =>
  import("./ConsentBanner").then((module) => ({ default: module.ConsentBanner })),
);

/**
 * Asks once per browser, on every page, whether usage data may be shared. It shows only after the
 * saved answer has been read and while it is unanswered, and never in a build without analytics.
 */
export function AnalyticsConsent() {
  const { consent, setConsent } = useUsageConsent();

  if (consent !== "unanswered" || !isAnalyticsConfigured()) {
    return null;
  }
  return (
    <Suspense fallback={null}>
      <ConsentBanner onAnswer={setConsent} />
    </Suspense>
  );
}
