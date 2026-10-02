import { Link } from "react-router";

import { Card } from "@/ui/primitives/card";
import { ExternalLink } from "@/ui/shared/ExternalLink";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { t } from "@/ui/shared/strings";

const METADATA_REPO_URL = "https://github.com/neetcode-gh/leetcode";

/** Privacy and credits for the local-first app, and what an optional account stores. */
export function PrivacyPage() {
  return (
    <>
      <title>{t.documentTitle(t.pages.privacy)}</title>
      <h1 className="mb-6 font-serif text-3xl">{t.pages.privacy}</h1>
      <div className="flex flex-col gap-7">
        <section aria-labelledby="privacy-data-heading">
          <SectionLabel id="privacy-data-heading">{t.privacy.yourData}</SectionLabel>
          <Card className="space-y-3 p-4 text-sm">
            <p>{t.privacy.browserStorage}</p>
            <p>{t.privacy.exportAndReset}</p>
          </Card>
        </section>
        <section aria-labelledby="privacy-account-heading">
          <SectionLabel id="privacy-account-heading">{t.privacy.account}</SectionLabel>
          <Card className="space-y-3 p-4 text-sm">
            <p>{t.privacy.accountStorage}</p>
            <p>{t.privacy.accountDelete}</p>
          </Card>
        </section>
        <section aria-labelledby="privacy-analytics-heading">
          <SectionLabel id="privacy-analytics-heading">{t.privacy.analytics}</SectionLabel>
          <Card className="space-y-3 p-4 text-sm">
            <p>{t.privacy.analyticsPurpose}</p>
            <p>{t.privacy.analyticsIntro}</p>
            <ul className="list-disc space-y-1 pl-5">
              {t.privacy.events.map((event) => (
                <li key={event}>{event}</li>
              ))}
            </ul>
            <p>{t.privacy.analyticsDetails}</p>
            <p>{t.privacy.analyticsStorage}</p>
            <p>{t.privacy.neverCollected}</p>
            <p>
              {t.privacy.optOutBefore}{" "}
              <Link to="/settings" className="text-primary underline">
                {t.privacy.settingsLink}
              </Link>
              {t.privacy.optOutAfter}
            </p>
          </Card>
        </section>
        <section aria-labelledby="privacy-credits-heading">
          <SectionLabel id="privacy-credits-heading">{t.privacy.credits}</SectionLabel>
          <Card className="space-y-3 p-4 text-sm">
            <p>
              {t.privacy.metadataBefore}{" "}
              <ExternalLink href={METADATA_REPO_URL}>{t.privacy.metadataSource}</ExternalLink>
              {t.privacy.metadataAfter}
            </p>
            <p>{t.privacy.ownSummaries}</p>
            <p>{t.privacy.notAffiliated}</p>
            <ExternalLink href="/NOTICE.md">{t.privacy.mitTitle}</ExternalLink>
          </Card>
        </section>
      </div>
    </>
  );
}
