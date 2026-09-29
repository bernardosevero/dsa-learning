import { CircleAlertIcon, CheckIcon, DownloadIcon, UploadIcon } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent } from "react";

import { downloadExport } from "@/storage/download";
import { track } from "@/ui/analytics";
import { useAppData } from "@/ui/app/AppData";
import { Alert, AlertDescription } from "@/ui/primitives/alert";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { t } from "@/ui/shared/strings";

type ImportResult =
  { status: "imported"; added: number } | { status: "failed"; fileName: string; error: string };

/** Your data: export the save file, and import one, which merges and never replaces. */
export function DataSettings() {
  const { file, importText } = useAppData();
  const headingId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  function handleExport() {
    downloadExport(file);
    track("exported");
  }

  function handleChooseFile() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const chosenFile = input.files?.[0];
    // Cleared so choosing the same file again still fires a change.
    input.value = "";
    if (chosenFile === undefined) {
      return;
    }
    const result = importText(await chosenFile.text());
    if (result.ok) {
      track("imported", { added: result.added });
    }
    setImportResult(
      result.ok
        ? { status: "imported", added: result.added }
        : { status: "failed", fileName: chosenFile.name, error: result.error },
    );
  }

  return (
    <section aria-labelledby={headingId}>
      <SectionLabel id={headingId}>{t.settings.yourData}</SectionLabel>
      <Card>
        <p className="px-4 pt-4 text-sm text-muted-foreground">{t.settings.dataIntro}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="font-semibold">{t.settings.export}</span>
            <span className="text-sm text-muted-foreground">{t.settings.exportHint}</span>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <DownloadIcon aria-hidden />
            {t.settings.downloadJson}
          </Button>
        </div>
        <div className="flex flex-col gap-3 p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-semibold">{t.settings.import}</span>
              <span className="text-sm text-muted-foreground">{t.settings.importHint}</span>
            </div>
            <Button variant="outline" onClick={handleChooseFile}>
              <UploadIcon aria-hidden />
              {t.settings.chooseFile}
            </Button>
            {/* The button above is the control; this input only opens the file picker. */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              tabIndex={-1}
              aria-hidden
              className="hidden"
              onChange={(event) => void handleFileChange(event)}
            />
          </div>
          <ImportResultNote result={importResult} />
        </div>
      </Card>
    </section>
  );
}

interface ImportResultNoteProps {
  result: ImportResult | null;
}

// Always rendered, so the live region exists before a result is announced into it.
function ImportResultNote({ result }: ImportResultNoteProps) {
  if (result === null) {
    return <div role="status" />;
  }
  if (result.status === "imported") {
    return (
      <Alert variant="success" role="status">
        <CheckIcon aria-hidden />
        <AlertDescription>{t.settings.imported(result.added)}</AlertDescription>
      </Alert>
    );
  }
  return (
    <Alert variant="destructive" role="alert">
      <CircleAlertIcon aria-hidden />
      <AlertDescription>
        <p>
          <strong>{t.settings.importFailed(result.fileName)}</strong> {t.settings.dataUnchanged}
        </p>
        <p className="whitespace-pre-line">{result.error}</p>
      </AlertDescription>
    </Alert>
  );
}
