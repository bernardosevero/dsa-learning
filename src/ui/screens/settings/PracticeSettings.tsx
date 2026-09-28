import { useId, useState, type ChangeEvent } from "react";

import type { Difficulty } from "@/domain/types";
import { useAppData } from "@/ui/app/AppData";
import { Card } from "@/ui/primitives/card";
import { Input } from "@/ui/primitives/input";
import { Label } from "@/ui/primitives/label";
import { Switch } from "@/ui/primitives/switch";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { t } from "@/ui/shared/strings";

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const satisfies readonly Difficulty[];
const MIN_TIME_BOX_MINUTES = 1;
const MAX_TIME_BOX_MINUTES = 180;

// Only a whole number of minutes in range is saved; anything else stays in the field to fix.
function parseTimeBox(text: string): number | null {
  const minutes = Number(text);
  const isInRange = minutes >= MIN_TIME_BOX_MINUTES && minutes <= MAX_TIME_BOX_MINUTES;
  return text.trim() !== "" && Number.isInteger(minutes) && isInRange ? minutes : null;
}

/** Practice: the three time boxes, saved on every valid change, and the pattern-on-reviews switch. */
export function PracticeSettings() {
  const { file, updateSettings } = useAppData();
  const headingId = useId();
  const patternLabelId = useId();
  const patternHintId = useId();
  const errorId = useId();
  const { timeBoxMinutes, showPatternOnReviews } = file.settings;
  // Only an invalid value is kept as typed; a valid one is saved and shown from the settings,
  // so a change from elsewhere (an import) shows up here too.
  const [invalidDrafts, setInvalidDrafts] = useState<Partial<Record<Difficulty, string>>>({});
  const invalidDifficulties = DIFFICULTIES.filter(
    (difficulty) => invalidDrafts[difficulty] !== undefined,
  );

  function handleTimeBoxChange(difficulty: Difficulty, event: ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    const minutes = parseTimeBox(text);
    if (minutes === null) {
      setInvalidDrafts((current) => ({ ...current, [difficulty]: text }));
      return;
    }
    setInvalidDrafts((current) => ({ ...current, [difficulty]: undefined }));
    updateSettings({ timeBoxMinutes: { ...timeBoxMinutes, [difficulty]: minutes } });
  }

  function handlePatternChange(isChecked: boolean) {
    updateSettings({ showPatternOnReviews: isChecked });
  }

  return (
    <section aria-labelledby={headingId}>
      <SectionLabel id={headingId}>{t.settings.practice}</SectionLabel>
      <Card>
        <fieldset
          aria-describedby={invalidDifficulties.length > 0 ? errorId : undefined}
          className="flex flex-col gap-3 border-b p-4"
        >
          <legend className="float-left font-semibold">{t.settings.timeBoxes}</legend>
          <p className="clear-both text-sm text-muted-foreground">{t.settings.timeBoxesHint}</p>
          <div className="grid grid-cols-3 gap-3">
            {DIFFICULTIES.map((difficulty) => (
              <TimeBoxField
                key={difficulty}
                difficulty={difficulty}
                value={invalidDrafts[difficulty] ?? String(timeBoxMinutes[difficulty])}
                isInvalid={invalidDifficulties.includes(difficulty)}
                onChange={handleTimeBoxChange}
              />
            ))}
          </div>
          {invalidDifficulties.length > 0 && (
            <p id={errorId} className="text-sm text-destructive">
              {t.settings.timeBoxInvalid(MIN_TIME_BOX_MINUTES, MAX_TIME_BOX_MINUTES)}
            </p>
          )}
        </fieldset>
        <div className="flex items-center gap-4 p-4">
          <div className="flex flex-1 flex-col gap-1">
            <Label
              id={patternLabelId}
              htmlFor={`${patternLabelId}-switch`}
              className="font-semibold"
            >
              {t.settings.showPattern}
            </Label>
            <p id={patternHintId} className="text-sm text-muted-foreground">
              {t.settings.showPatternHint}
            </p>
          </div>
          <Switch
            id={`${patternLabelId}-switch`}
            checked={showPatternOnReviews}
            onCheckedChange={handlePatternChange}
            aria-describedby={patternHintId}
          />
        </div>
      </Card>
    </section>
  );
}

interface TimeBoxFieldProps {
  difficulty: Difficulty;
  value: string;
  isInvalid: boolean;
  onChange: (difficulty: Difficulty, event: ChangeEvent<HTMLInputElement>) => void;
}

function TimeBoxField({ difficulty, value, isInvalid, onChange }: TimeBoxFieldProps) {
  const inputId = useId();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(difficulty, event);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{difficulty}</Label>
      <div className="flex items-center gap-1.5">
        <Input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={MIN_TIME_BOX_MINUTES}
          max={MAX_TIME_BOX_MINUTES}
          step={1}
          value={value}
          aria-invalid={isInvalid}
          onChange={handleChange}
          className="w-20 font-mono"
        />
        <span className="text-sm text-muted-foreground">{t.settings.minutesSuffix}</span>
      </div>
    </div>
  );
}
