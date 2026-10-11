import { ExternalLink } from "@/ui/shared/ExternalLink";
import { t } from "@/ui/shared/strings";

import { DataLocations } from "./DataLocations";
import { SentEvents } from "./SentEvents";
import { UsageSharingBand } from "./UsageSharingBand";

const METADATA_REPO_URL = "https://github.com/neetcode-gh/leetcode";

/**
 * Privacy and credits for the local-first app: where data lives, what an optional account stores,
 * the anonymous-usage switch and what it sends. Public: it renders outside the practice app, and
 * its text is in the HTML.
 */
export function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-[clamp(48px,6vw,72px)] px-[clamp(16px,4vw,40px)] pb-[clamp(56px,7vw,96px)]">
      <div className="flex max-w-[760px] flex-col gap-4.5 pt-[clamp(40px,6vw,80px)]">
        <p className="font-mono text-[13px] tracking-[0.08em] text-muted-foreground uppercase">
          {t.privacy.eyebrow}
        </p>
        <h1 className="font-serif text-[clamp(38px,5.4vw,60px)] leading-[1.05] font-medium tracking-[-0.02em] text-balance">
          {t.privacy.title}
        </h1>
        <p className="text-lg">{t.privacy.intro}</p>
      </div>
      <DataLocations />
      <UsageSharingBand />
      <SentEvents />
      <section
        aria-labelledby="privacy-credits"
        className="flex flex-wrap gap-x-16 gap-y-6 border-t pt-10"
      >
        <h2
          id="privacy-credits"
          className="flex-[1_1_280px] font-serif text-[32px] leading-tight font-medium"
        >
          {t.privacy.credits}
        </h2>
        <div className="flex flex-[2_1_480px] flex-col items-start gap-3">
          <p>
            {t.privacy.metadataBefore}{" "}
            <ExternalLink href={METADATA_REPO_URL}>{t.privacy.metadataSource}</ExternalLink>
            {t.privacy.metadataAfter}
          </p>
          <p>{t.privacy.ownSummaries}</p>
          <p>{t.privacy.notAffiliated}</p>
          <ExternalLink href="/NOTICE.md">{t.privacy.mitTitle}</ExternalLink>
        </div>
      </section>
    </div>
  );
}
