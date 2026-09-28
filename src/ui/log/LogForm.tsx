import type { FormEvent } from "react";

import { Button } from "@/ui/components/ui/button";
import { t } from "@/ui/strings";

import { HelpSegmented } from "./HelpSegmented";
import { KeyInsightField } from "./KeyInsightField";
import type { LogValues, ValidLog } from "./logForm";
import { NotesField } from "./NotesField";
import { RatingCards } from "./RatingCards";
import { TimeField } from "./TimeField";
import { useLogForm } from "./useLogForm";
import { useLogShortcuts } from "./useLogShortcuts";

export interface LogFormProps {
  initialValues: LogValues;
  isTimeFromTimer: boolean;
  onSave: (log: ValidLog) => void;
}

/** The Log form: rating, time, help, key insight and notes. Built to take under 30 seconds. */
export function LogForm({ initialValues, isTimeFromTimer, onSave }: LogFormProps) {
  const { values, errors, update, changeHelp, submit } = useLogForm(initialValues, onSave);
  useLogShortcuts((rating) => update({ rating }), submit);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit();
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-6">
      <RatingCards
        value={values.rating}
        onChange={(rating) => update({ rating })}
        error={errors.rating}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TimeField
          value={values.timeText}
          onChange={(timeText) => update({ timeText })}
          isFromTimer={isTimeFromTimer}
          error={errors.time}
        />
        <HelpSegmented value={values.help} onChange={changeHelp} />
      </div>
      <KeyInsightField
        value={values.keyInsight}
        onChange={(keyInsight) => update({ keyInsight })}
      />
      <NotesField value={values.notes} onChange={(notes) => update({ notes })} />
      <Button type="submit" className="min-h-11 w-full">
        {t.log.save}
        <kbd className="font-mono text-xs opacity-80">{t.log.saveShortcut}</kbd>
      </Button>
    </form>
  );
}
