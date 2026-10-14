import type { UsageConsent } from "@/storage/usageConsent";
import { Card } from "@/ui/primitives/card";
import { t } from "@/ui/shared/strings";
import { UsageSharingControl } from "@/ui/shared/UsageSharingControl";
import { useUsageConsent } from "@/ui/shared/useUsageConsent";

function toStateLabel(consent: UsageConsent | undefined): string {
  if (consent === undefined) {
    return "";
  }
  return consent === "accepted" ? t.privacy.switchState.on : t.privacy.switchState.off;
}

/** The usage-sharing switch in a band of its own: this browser's answer, as in the banner and Settings. */
export function UsageSharingBand() {
  const { consent, setConsent } = useUsageConsent();

  return (
    <section
      id="usage-sharing"
      aria-labelledby="privacy-switch"
      className="flex scroll-mt-6 flex-wrap items-center justify-between gap-x-10 gap-y-5 rounded-[20px] bg-accent p-[clamp(24px,4vw,40px)]"
    >
      <div className="flex flex-[1_1_420px] flex-col gap-2">
        <h2 id="privacy-switch" className="font-serif text-[28px] leading-tight font-medium">
          {t.privacy.switchTitle}
        </h2>
        <p className="text-[15px]">
          {t.privacy.switchApplies} {t.privacy.switchKeepsSent}
        </p>
      </div>
      <div className="flex flex-[0_1_380px] items-center gap-3">
        {/* The state in words for sighted readers; the switch already announces it. */}
        <p className="min-w-[2.5em] text-right font-mono text-sm" aria-hidden>
          {toStateLabel(consent)}
        </p>
        <Card className="flex-1">
          <UsageSharingControl consent={consent} onConsentChange={setConsent} />
        </Card>
      </div>
    </section>
  );
}
