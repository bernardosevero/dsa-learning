import { useId } from "react";

import { useAppData } from "@/ui/app/AppData";
import { Card } from "@/ui/primitives/card";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { t } from "@/ui/shared/strings";
import { SwitchRow } from "@/ui/shared/SwitchRow";
import { UsageSharingControl } from "@/ui/shared/UsageSharingControl";
import { useUsageConsent } from "@/ui/shared/useUsageConsent";

/**
 * Privacy: this browser's usage-sharing answer and, when signed in, linking usage to the account,
 * which only applies while sharing is on. The full notice is linked from the page footer.
 */
export function PrivacySettings() {
  const { account, file, updateSettings } = useAppData();
  const { consent, setConsent } = useUsageConsent();
  const headingId = useId();
  const isSharing = consent === "accepted";

  function handleLinkChange(isChecked: boolean) {
    updateSettings({ linkUsageToAccount: isChecked });
  }

  return (
    <section aria-labelledby={headingId}>
      <SectionLabel id={headingId}>{t.settings.privacy}</SectionLabel>
      <Card>
        <UsageSharingControl consent={consent} onConsentChange={setConsent} />
        {account.status === "signedIn" && (
          <SwitchRow
            label={t.settings.linkUsage}
            hint={isSharing ? t.settings.linkUsageHint : t.settings.linkUsageNeedsSharing}
            isChecked={file.settings.linkUsageToAccount}
            isDisabled={!isSharing}
            onCheckedChange={handleLinkChange}
            className="border-t"
          />
        )}
      </Card>
    </section>
  );
}
