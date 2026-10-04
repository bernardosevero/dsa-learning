import { SwitchRow } from "./SwitchRow";
import { t } from "./strings";

export interface UsageSharingControlProps {
  /** The saved choice, or undefined while it is still being read; the switch waits until then. */
  isEnabled: boolean | undefined;
  onEnabledChange: (isEnabled: boolean) => void;
}

/** The anonymous-usage switch, shared by Settings and the public Privacy page. */
export function UsageSharingControl({ isEnabled, onEnabledChange }: UsageSharingControlProps) {
  return (
    <SwitchRow
      label={t.settings.shareAnonymousUsage}
      hint={t.settings.shareAnonymousUsageHint}
      isChecked={isEnabled ?? false}
      isDisabled={isEnabled === undefined}
      onCheckedChange={onEnabledChange}
    />
  );
}
