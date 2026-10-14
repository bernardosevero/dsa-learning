import { useId } from "react";
import { Link } from "react-router";

import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { isAnalyticsConfigured } from "@/ui/shared/analytics";
import { t } from "@/ui/shared/strings";
import { useUsageConsent } from "@/ui/shared/useUsageConsent";

/**
 * Asks once per browser whether usage data may be shared, on every page until it is answered.
 * It shows only after the saved answer is read and floats over the page, so it never moves
 * content; Accept and Decline carry the same weight. A build without analytics never asks.
 */
export function ConsentBanner() {
  const { consent, setConsent } = useUsageConsent();
  const titleId = useId();

  if (consent !== "unanswered" || !isAnalyticsConfigured()) {
    return null;
  }

  function handleDecline() {
    setConsent("declined");
  }

  function handleAccept() {
    setConsent("accepted");
  }

  return (
    // Above the practice bottom bar on phones: it stays covered only until the visitor answers.
    <section aria-labelledby={titleId} className="fixed inset-x-0 bottom-0 z-20 p-3 sheet:p-4">
      {/* The one floating surface besides menus and dialogs, so it takes their shadow. */}
      <Card className="mx-auto flex max-w-[720px] flex-col gap-3 p-4 shadow-lg sheet:flex-row sheet:items-center sheet:gap-5">
        <div className="flex flex-1 flex-col gap-1">
          <h2 id={titleId} className="font-semibold">
            {t.consentBanner.title}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t.consentBanner.body}{" "}
            <Link to="/privacy" className="text-primary underline">
              {t.consentBanner.privacyLink}
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleDecline}>
            {t.consentBanner.decline}
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleAccept}>
            {t.consentBanner.accept}
          </Button>
        </div>
      </Card>
    </section>
  );
}
