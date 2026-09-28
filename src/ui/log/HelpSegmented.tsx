import type { Help } from "@/domain/types";
import { t } from "@/ui/strings";

const HELPS: readonly Help[] = ["none", "hint", "solution"];

export interface HelpSegmentedProps {
  value: Help;
  onChange: (help: Help) => void;
}

/** None · Hint · Solution as one segmented radio group. */
export function HelpSegmented({ value, onChange }: HelpSegmentedProps) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold">{t.log.helpLegend}</legend>
      <div className="flex rounded-lg border bg-card p-0.5">
        {HELPS.map((help) => (
          <label
            key={help}
            className="flex min-h-10 flex-1 cursor-pointer items-center justify-center rounded-md text-sm text-muted-foreground has-[:checked]:bg-accent has-[:checked]:font-semibold has-[:checked]:text-primary has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50"
          >
            <input
              type="radio"
              name="help"
              value={help}
              checked={value === help}
              onChange={() => onChange(help)}
              className="sr-only"
            />
            {t.log.helps[help]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
