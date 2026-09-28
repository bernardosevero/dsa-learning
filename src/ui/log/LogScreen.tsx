import { useState } from "react";

import type { Problem } from "@/domain/types";
import { useAppData } from "@/ui/AppData";
import { FocusFrame } from "@/ui/components/FocusFrame";
import { ProblemKindBadge } from "@/ui/components/ProblemKindBadge";
import { t } from "@/ui/strings";

import { LogForm } from "./LogForm";
import { LoggedView } from "./LoggedView";
import { valuesFromLog, type LogValues, type SavedLog } from "./logForm";
import { useLogActions } from "./useLogActions";

export interface LogScreenProps {
  problem: Problem;
  initialValues: LogValues;
  isTimeFromTimer: boolean;
}

/** S3 for one problem: the form, then the confirmation once saved; Undo goes back to the form. */
export function LogScreen({ problem, initialValues, isTimeFromTimer }: LogScreenProps) {
  const { states } = useAppData();
  const { save, undo } = useLogActions(problem.id);
  const [formValues, setFormValues] = useState(initialValues);
  const [saved, setSaved] = useState<SavedLog | null>(null);

  function handleUndo(savedLog: SavedLog) {
    undo(savedLog);
    setFormValues(valuesFromLog(savedLog.log));
    setSaved(null);
  }

  if (saved !== null) {
    return <LoggedView problem={problem} saved={saved} onUndo={() => handleUndo(saved)} />;
  }
  const isReview = (states[problem.id]?.status ?? "new") !== "new";
  return (
    <FocusFrame
      back={{ to: `/solve/${problem.id}`, label: t.log.backToTimer }}
      badge={<ProblemKindBadge isReview={isReview} isPatternHidden />}
    >
      <title>{t.documentTitle(`${t.pages.logAttempt} ${problem.title}`)}</title>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t.log.label}
        </p>
        <h1 className="font-serif text-3xl font-semibold">{problem.title}</h1>
      </div>
      <LogForm
        initialValues={formValues}
        isTimeFromTimer={isTimeFromTimer}
        onSave={(log) => setSaved(save(log))}
      />
    </FocusFrame>
  );
}
