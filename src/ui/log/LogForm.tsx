import { useEffect, useEffectEvent, useState, type FormEvent } from "react";

import { INTERVAL_DAYS } from "@/domain/schedule";
import type { Help, Rating } from "@/domain/types";
import { RATING_STYLES } from "@/ui/components/RatingChip";
import { Button } from "@/ui/components/ui/button";
import { Card } from "@/ui/components/ui/card";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/ui/components/ui/radio-group";
import { Textarea } from "@/ui/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/ui/components/ui/toggle-group";
import { cn } from "@/ui/lib/utils";
import { t } from "@/ui/strings";

import {
  MAX_MINUTES,
  MIN_MINUTES,
  validateLog,
  type LogErrors,
  type LogValues,
  type ValidLog,
} from "./logValues";

const RATINGS: readonly Rating[] = ["hard", "medium", "easy"];
const SHORTCUT_RATINGS: Record<string, Rating> = { "1": "hard", "2": "medium", "3": "easy" };
const HELPS: readonly Help[] = ["none", "hint", "solution"];
const FIELD_LABEL_CLASSES = "text-sm font-semibold";

// Typing a digit into the time or a text box must not change the rating.
function isTextField(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
}

function findRating(value: string): Rating | undefined {
  return RATINGS.find((rating) => rating === value);
}

function findHelp(value: string): Help | undefined {
  return HELPS.find((help) => help === value);
}

export interface LogFormProps {
  initialValues: LogValues;
  isTimeFromTimer: boolean;
  onSave: (log: ValidLog) => void;
}

/** The Log form: rating, time, help, key insight and notes. Built to take under 30 seconds. */
export function LogForm({ initialValues, isTimeFromTimer, onSave }: LogFormProps) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<LogErrors>({});
  const [isNotesOpen, setIsNotesOpen] = useState(initialValues.notes !== "");

  function update(changes: Partial<LogValues>) {
    setValues((current) => ({ ...current, ...changes }));
  }

  function submit() {
    const result = validateLog(values);
    if (result.ok) {
      onSave(result.value);
    } else {
      setErrors(result.errors);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  function handleRatingChange(value: string) {
    const rating = findRating(value);
    if (rating !== undefined) {
      update({ rating });
    }
  }

  // Looking at the solution pre-selects Hard, but never overrides a rating the user chose.
  // A single ToggleGroup reports "" when the chosen item is pressed again; help stays chosen.
  function handleHelpChange(value: string) {
    const help = findHelp(value);
    if (help === undefined) {
      return;
    }
    setValues((current) => {
      const rating = help === "solution" && current.rating === null ? "hard" : current.rating;
      return { ...current, help, rating };
    });
  }

  // 1/2/3 choose a rating outside text fields; Ctrl+Enter (or ⌘+Enter) saves from anywhere.
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const hasModifier = event.ctrlKey || event.metaKey;
    if (hasModifier && event.key === "Enter") {
      event.preventDefault();
      submit();
      return;
    }
    const rating = SHORTCUT_RATINGS[event.key];
    if (rating === undefined || hasModifier || event.altKey || isTextField(event.target)) {
      return;
    }
    event.preventDefault();
    update({ rating });
  });
  useEffect(() => {
    function listener(event: KeyboardEvent) {
      handleKeyDown(event);
    }
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, []);

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <p id="log-rating-label" className="font-semibold">
          {t.log.ratingLegend}
        </p>
        <RadioGroup
          value={values.rating ?? ""}
          onValueChange={handleRatingChange}
          aria-labelledby="log-rating-label"
          aria-describedby={errors.rating === undefined ? undefined : "rating-error"}
          className="gap-2"
        >
          {RATINGS.map((rating, index) => (
            <RatingCard
              key={rating}
              rating={rating}
              shortcut={String(index + 1)}
              isSelected={values.rating === rating}
            />
          ))}
        </RadioGroup>
        {errors.rating !== undefined && (
          <p id="rating-error" role="alert" className="text-sm text-destructive">
            {errors.rating}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="log-time" className={FIELD_LABEL_CLASSES}>
            {t.log.time}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="log-time"
              type="number"
              inputMode="numeric"
              min={MIN_MINUTES}
              max={MAX_MINUTES}
              value={values.timeText}
              onChange={(event) => update({ timeText: event.target.value })}
              aria-invalid={errors.time !== undefined}
              aria-describedby={errors.time === undefined ? undefined : "time-error"}
              className="w-24 font-mono"
            />
            <span className="text-sm text-muted-foreground">{t.log.minutesSuffix}</span>
          </div>
          {isTimeFromTimer && <p className="text-xs text-muted-foreground">{t.log.fromTimer}</p>}
          {errors.time !== undefined && (
            <p id="time-error" role="alert" className="text-sm text-destructive">
              {errors.time}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <p id="log-help-label" className={FIELD_LABEL_CLASSES}>
            {t.log.helpLegend}
          </p>
          <ToggleGroup
            type="single"
            variant="outline"
            value={values.help}
            onValueChange={handleHelpChange}
            aria-labelledby="log-help-label"
            className="w-full rounded-lg bg-card"
          >
            {HELPS.map((help) => (
              <ToggleGroupItem
                key={help}
                value={help}
                className="text-muted-foreground data-[state=on]:bg-accent data-[state=on]:font-semibold data-[state=on]:text-primary"
              >
                {t.log.helps[help]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="log-insight" className={FIELD_LABEL_CLASSES}>
          {t.log.keyInsight}
        </Label>
        <p id="log-insight-hint" className="text-xs text-muted-foreground">
          {t.log.keyInsightHint}
        </p>
        <Textarea
          id="log-insight"
          rows={2}
          value={values.keyInsight}
          placeholder={t.log.keyInsightPlaceholder}
          aria-describedby="log-insight-hint"
          onChange={(event) => update({ keyInsight: event.target.value })}
        />
      </div>

      {isNotesOpen ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="log-notes" className={FIELD_LABEL_CLASSES}>
            {t.log.notes}
          </Label>
          <Textarea
            id="log-notes"
            rows={3}
            value={values.notes}
            onChange={(event) => update({ notes: event.target.value })}
          />
        </div>
      ) : (
        <Button
          type="button"
          variant="link"
          onClick={() => setIsNotesOpen(true)}
          className="self-start px-0"
        >
          {t.log.addNotes}
        </Button>
      )}

      <Button type="submit" className="w-full">
        {t.log.save}
        <kbd className="font-mono text-xs opacity-80">{t.log.saveShortcut}</kbd>
      </Button>
    </form>
  );
}

interface RatingCardProps {
  rating: Rating;
  shortcut: string;
  isSelected: boolean;
}

/**
 * One rating as a radio card: glyph and word, interval, shortcut, and the anchor text. The radio
 * is named by its word and described by the anchor, so a screen reader doesn't read a paragraph.
 */
function RatingCard({ rating, shortcut, isSelected }: RatingCardProps) {
  const style = RATING_STYLES[rating];
  return (
    <Card className={cn(isSelected && style.selected)}>
      <Label className="grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 p-4 font-normal">
        <RadioGroupItem
          value={rating}
          aria-labelledby={`rating-${rating}-name`}
          aria-describedby={`rating-${rating}-anchor`}
        />
        <span id={`rating-${rating}-name`} className={cn("font-semibold", style.text)}>
          <span aria-hidden className="mr-1.5 tracking-tighter">
            {style.glyph}
          </span>
          {t.ratings[rating]}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-mono">{t.log.intervalDays(INTERVAL_DAYS[rating])}</span>
          <kbd className="rounded border px-1.5 font-mono">{shortcut}</kbd>
        </span>
        <span
          id={`rating-${rating}-anchor`}
          className="col-span-2 col-start-2 text-sm leading-normal text-muted-foreground"
        >
          {t.log.anchors[rating]}
        </span>
      </Label>
    </Card>
  );
}
