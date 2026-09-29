import { useId } from "react";

import { useAppData } from "@/ui/app/AppData";
import { Card } from "@/ui/primitives/card";
import { setAnalyticsEnabled } from "@/ui/shared/analytics";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { t } from "@/ui/shared/strings";

import { SwitchRow } from "./SwitchRow";

/** Privacy: the saved anonymous-analytics choice; the full notice is linked from the page footer. */
export function PrivacySettings() {
  const { file, updateSettings } = useAppData();
  const headingId = useId();

  function handleUsageChange(isChecked: boolean) {
    setAnalyticsEnabled(isChecked);
    updateSettings({ shareAnonymousUsage: isChecked });
  }

  return (
    <section aria-labelledby={headingId}>
      <SectionLabel id={headingId}>{t.settings.privacy}</SectionLabel>
      <Card>
        <SwitchRow
          label={t.settings.shareAnonymousUsage}
          hint={t.settings.shareAnonymousUsageHint}
          isChecked={file.settings.shareAnonymousUsage}
          onCheckedChange={handleUsageChange}
        />
      </Card>
    </section>
  );
}
