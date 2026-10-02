import { useId, useState } from "react";

import { useAppData } from "@/ui/app/AppData";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { t } from "@/ui/shared/strings";

/** The danger zone: resetting progress only works once the user types "reset". */
export function ResetProgress() {
  const { account, resetProgress } = useAppData();
  const headingId = useId();
  const inputId = useId();
  const [confirmation, setConfirmation] = useState("");
  const [hasReset, setHasReset] = useState(false);
  const isConfirmed = confirmation === t.settings.resetWord;

  function handleReset() {
    resetProgress();
    setConfirmation("");
    setHasReset(true);
  }

  return (
    <section aria-labelledby={headingId}>
      <SectionLabel id={headingId} className="text-destructive">
        {t.settings.dangerZone}
      </SectionLabel>
      <Card className="gap-3 border-destructive p-4">
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{t.settings.reset}</span>
          <p className="text-sm text-muted-foreground">
            {account.status === "signedIn" ? t.settings.resetHintSignedIn : t.settings.resetHint}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="flex min-w-40 flex-1 flex-col gap-1.5">
            <Label htmlFor={inputId}>
              {t.settings.resetConfirmBefore}{" "}
              <span className="font-mono">{t.settings.resetWord}</span>{" "}
              {t.settings.resetConfirmAfter}
            </Label>
            <Input
              id={inputId}
              value={confirmation}
              autoComplete="off"
              spellCheck={false}
              onChange={(event) => setConfirmation(event.target.value)}
              className="font-mono"
            />
          </div>
          <Button variant="destructive" disabled={!isConfirmed} onClick={handleReset}>
            {t.settings.reset}
          </Button>
        </div>
        <p role="status" className="text-sm text-muted-foreground">
          {hasReset && t.settings.resetDone}
        </p>
      </Card>
    </section>
  );
}
