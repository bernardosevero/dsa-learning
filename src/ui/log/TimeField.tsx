import { t } from "@/ui/strings";

export interface TimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  isFromTimer: boolean;
  error?: string;
}

/** Minutes spent, prefilled from the timer when there was one. */
export function TimeField({ value, onChange, isFromTimer, error }: TimeFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="log-time" className="text-sm font-semibold">
        {t.log.time}
      </label>
      <div className="flex items-center gap-2">
        <input
          id="log-time"
          type="number"
          inputMode="numeric"
          min={1}
          max={600}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error !== undefined}
          aria-describedby={error === undefined ? undefined : "time-error"}
          className="min-h-10 w-24 rounded-lg border bg-card px-3 font-mono outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <span className="text-sm text-muted-foreground">{t.log.minutesSuffix}</span>
      </div>
      {isFromTimer && <p className="text-xs text-muted-foreground">{t.log.fromTimer}</p>}
      {error !== undefined && (
        <p id="time-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
