import { ExternalLink } from "@/ui/shared/ExternalLink";
import { t } from "@/ui/shared/strings";

import { DataSettings } from "./DataSettings";
import { PracticeSettings } from "./PracticeSettings";
import { ResetProgress } from "./ResetProgress";

const METADATA_REPO_URL = "https://github.com/neetcode-gh/leetcode";

/** S6: time boxes and the pattern switch, export and import, and resetting progress. */
export function SettingsPage() {
  return (
    <>
      <title>{t.documentTitle(t.pages.settings)}</title>
      <h1 className="mb-6 font-serif text-3xl">{t.pages.settings}</h1>
      <div className="flex flex-col gap-7">
        <PracticeSettings />
        <DataSettings />
        <ResetProgress />
        <p className="text-center">
          <ExternalLink href={METADATA_REPO_URL} className="text-xs text-muted-foreground">
            {t.settings.credit}
          </ExternalLink>
        </p>
      </div>
    </>
  );
}
