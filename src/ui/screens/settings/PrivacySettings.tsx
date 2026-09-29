import { useId } from "react";
import { Link } from "react-router";

import { setAnalyticsEnabled } from "@/ui/analytics";
import { useAppData } from "@/ui/app/AppData";
import { Card } from "@/ui/primitives/card";
import { Label } from "@/ui/primitives/label";
import { Switch } from "@/ui/primitives/switch";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { t } from "@/ui/shared/strings";

/** Privacy: the saved anonymous-analytics choice and the full notice. */
export function PrivacySettings() {
  const { file, updateSettings } = useAppData();
  const headingId = useId();
  const switchId = useId();
  const hintId = useId();

  function handleUsageChange(isChecked: boolean) {
    setAnalyticsEnabled(isChecked);
    updateSettings({ shareAnonymousUsage: isChecked });
  }

  return (
    <section aria-labelledby={headingId}>
      <SectionLabel id={headingId}>{t.settings.privacy}</SectionLabel>
      <Card>
        <div className="flex items-center gap-4 border-b p-4">
          <div className="flex flex-1 flex-col gap-1">
            <Label htmlFor={switchId} className="font-semibold">
              {t.settings.shareAnonymousUsage}
            </Label>
            <p id={hintId} className="text-sm text-muted-foreground">
              {t.settings.shareAnonymousUsageHint}
            </p>
          </div>
          <Switch
            id={switchId}
            checked={file.settings.shareAnonymousUsage}
            onCheckedChange={handleUsageChange}
            aria-describedby={hintId}
          />
        </div>
        <div className="p-4">
          <Link to="/privacy" className="text-sm text-primary underline-offset-4 hover:underline">
            {t.settings.privacyAndCredits}
          </Link>
        </div>
      </Card>
    </section>
  );
}
