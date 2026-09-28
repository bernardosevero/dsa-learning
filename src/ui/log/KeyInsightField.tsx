import { t } from "@/ui/strings";

export interface KeyInsightFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/** The trick in the user's own words, shown back to them after their next attempt. */
export function KeyInsightField({ value, onChange }: KeyInsightFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="log-insight" className="text-sm font-semibold">
        {t.log.keyInsight}
      </label>
      <p id="log-insight-hint" className="text-xs text-muted-foreground">
        {t.log.keyInsightHint}
      </p>
      <textarea
        id="log-insight"
        rows={2}
        value={value}
        placeholder={t.log.keyInsightPlaceholder}
        aria-describedby="log-insight-hint"
        onChange={(event) => onChange(event.target.value)}
        className="rounded-lg border bg-card p-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      />
    </div>
  );
}
