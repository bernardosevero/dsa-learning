import { useState } from "react";

import type { Help } from "@/domain/types";

import { validateLog, type LogErrors, type LogValues, type ValidLog } from "./logForm";

// Looking at the solution pre-selects Hard, but never overrides a rating the user chose.
function withHelp(values: LogValues, help: Help): LogValues {
  const rating = help === "solution" && values.rating === null ? "hard" : values.rating;
  return { ...values, help, rating };
}

/** The Log form's values and errors, with the updates and submit the form and shortcuts share. */
export function useLogForm(initialValues: LogValues, onSave: (log: ValidLog) => void) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<LogErrors>({});

  function update(changes: Partial<LogValues>) {
    setValues((current) => ({ ...current, ...changes }));
  }
  function changeHelp(help: Help) {
    setValues((current) => withHelp(current, help));
  }
  function submit() {
    const result = validateLog(values);
    if (result.ok) {
      onSave(result.value);
    } else {
      setErrors(result.errors);
    }
  }
  return { values, errors, update, changeHelp, submit };
}
