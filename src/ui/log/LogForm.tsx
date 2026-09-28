import { useEffect, useEffectEvent, useState, type FormEvent } from "react";

import { INTERVAL_DAYS } from "@/domain/schedule";
import type { Help, Rating } from "@/domain/types";
import { RATING_STYLES } from "@/ui/components/RatingChip";
import { Button } from "@/ui/components/ui/button";
import { cn } from "@/ui/lib/utils";
import { t } from "@/ui/strings";

import { validateLog, type LogErrors, type LogValues, type ValidLog } from "./logForm";

const RATINGS: readonly Rating[] = ["hard", "medium", "easy"];
const SHORTCUT_RATINGS: Record<string, Rating> = { "1": "hard", "2": "medium", "3": "easy" };
const HELPS: readonly Help[] = ["none", "hint", "solution"];
const INPUT_CLASSES =
  "rounded-lg border bg-card outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";
const FOCUS_WITHIN_CLASSES = "has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50";

// Typing a digit into the time or a text box must not change the rating.
function isTextField(target: EventTarget | null): boolean {
  if (target instanceof HTMLTextAreaElement) {
    return true;
  }
  return target instanceof HTMLInputElement && target.type !== "radio";
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

  // Looking at the solution pre-selects Hard, but never overrides a rating the user chose.
  function changeHelp(help: Help) {
    setValues((current) => {
      const rating = help === "solution" && current.rating === null ? "hard" : current.rating;
      return { ...current, help, rating };
    });
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
      <fieldset aria-describedby={errors.rating === undefined ? undefined : "rating-error"}>
        <legend className="mb-3 font-semibold">{t.log.ratingLegend}</legend>
        <div className="flex flex-col gap-2">
          {RATINGS.map((rating, index) => (
            <RatingCard
              key={rating}
              rating={rating}
              shortcut={String(index + 1)}
              isSelected={values.rating === rating}
              onSelect={() => update({ rating })}
            />
          ))}
        </div>
        {errors.rating !== undefined && (
          <p id="rating-error" role="alert" className="mt-2 text-sm text-destructive">
            {errors.rating}
          </p>
        )}
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              value={values.timeText}
              onChange={(event) => update({ timeText: event.target.value })}
              aria-invalid={errors.time !== undefined}
              aria-describedby={errors.time === undefined ? undefined : "time-error"}
              className={cn(INPUT_CLASSES, "min-h-10 w-24 px-3 font-mono")}
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

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-semibold">{t.log.helpLegend}</legend>
          <div className="flex rounded-lg border bg-card p-0.5">
            {HELPS.map((help) => (
              <label
                key={help}
                className={cn(
                  "flex min-h-10 flex-1 cursor-pointer items-center justify-center rounded-md text-sm text-muted-foreground has-[:checked]:bg-accent has-[:checked]:font-semibold has-[:checked]:text-primary",
                  FOCUS_WITHIN_CLASSES,
                )}
              >
                <input
                  type="radio"
                  name="help"
                  value={help}
                  checked={values.help === help}
                  onChange={() => changeHelp(help)}
                  className="sr-only"
                />
                {t.log.helps[help]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

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
          value={values.keyInsight}
          placeholder={t.log.keyInsightPlaceholder}
          aria-describedby="log-insight-hint"
          onChange={(event) => update({ keyInsight: event.target.value })}
          className={cn(INPUT_CLASSES, "p-3 text-sm")}
        />
      </div>

      {isNotesOpen ? (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="log-notes" className="text-sm font-semibold">
            {t.log.notes}
          </label>
          <textarea
            id="log-notes"
            rows={3}
            value={values.notes}
            onChange={(event) => update({ notes: event.target.value })}
            className={cn(INPUT_CLASSES, "p-3 text-sm")}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsNotesOpen(true)}
          className="min-h-11 self-start rounded-sm text-sm text-primary outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {t.log.addNotes}
        </button>
      )}

      <Button type="submit" className="min-h-11 w-full">
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
  onSelect: () => void;
}

/** One rating as a radio card: glyph and word, interval, shortcut, and the anchor text. */
function RatingCard({ rating, shortcut, isSelected, onSelect }: RatingCardProps) {
  const style = RATING_STYLES[rating];
  return (
    <label
      className={cn(
        "grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1 rounded-xl border bg-card p-4",
        FOCUS_WITHIN_CLASSES,
        isSelected && style.selected,
      )}
    >
      <input
        type="radio"
        name="rating"
        value={rating}
        checked={isSelected}
        onChange={onSelect}
        className="outline-none"
      />
      <span className={cn("font-semibold", style.text)}>
        <span aria-hidden className="mr-1.5 tracking-tighter">
          {style.glyph}
        </span>
        {t.ratings[rating]}
      </span>
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">{t.log.intervalDays(INTERVAL_DAYS[rating])}</span>
        <kbd className="rounded border px-1.5 font-mono">{shortcut}</kbd>
      </span>
      <span className="col-span-2 col-start-2 text-sm text-muted-foreground">
        {t.log.anchors[rating]}
      </span>
    </label>
  );
}
