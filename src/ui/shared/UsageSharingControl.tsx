import type { UsageAnswer, UsageConsent } from "@/storage/usageConsent";

import { SwitchRow } from "./SwitchRow";
import { t } from "./strings";

export interface UsageSharingControlProps {
  /** This browser's answer, or undefined while it is still being read; the switch waits until then. */
  consent: UsageConsent | undefined;
  onConsentChange: (answer: UsageAnswer) => void;
}

/** The usage-sharing switch, shared by Settings and the public Privacy page: on only once accepted. */
export function UsageSharingControl({ consent, onConsentChange }: UsageSharingControlProps) {
  function handleCheckedChange(isChecked: boolean) {
    onConsentChange(isChecked ? "accepted" : "declined");
  }

  return (
    <SwitchRow
      label={t.settings.shareAnonymousUsage}
      hint={t.settings.shareAnonymousUsageHint}
      isChecked={consent === "accepted"}
      isDisabled={consent === undefined}
      onCheckedChange={handleCheckedChange}
    />
  );
}
