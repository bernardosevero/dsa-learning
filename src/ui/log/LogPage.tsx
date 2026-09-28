import { useState } from "react";
import { useParams, useSearchParams } from "react-router";

import { lastAttempt } from "@/domain/schedule";
import { useAppData } from "@/ui/AppData";
import { FocusFrame } from "@/ui/components/FocusFrame";
import { Overline } from "@/ui/components/Overline";
import { ProblemKindBadge } from "@/ui/components/ProblemKindBadge";
import { t } from "@/ui/strings";

import { LogForm } from "./LogForm";
import { LoggedView } from "./LoggedView";
import {
  countMinutesSince,
  createInitialLogValues,
  toLogValues,
  type SavedLog,
  type ValidLog,
} from "./logValues";

/** S3: log an attempt, then see what comes next and what was hidden. Undo goes back to the form. */
export function LogPage() {
  const { problemId } = useParams();
  const [searchParams] = useSearchParams();
  const { problems, states, file, todayDate, addAttempt, clearTimer, deleteEntry } = useAppData();
  const problem = problems.find((candidate) => candidate.id === problemId);

  // Read once on arrival: saving clears the timer, and the form must keep what it started with.
  const [timerMinutes] = useState(() => {
    const timer = file.activeTimer;
    if (timer === undefined || timer.problemId !== problemId) {
      return null;
    }
    return countMinutesSince(timer.startedAt, new Date());
  });
  const [formValues, setFormValues] = useState(() =>
    createInitialLogValues(searchParams.get("help"), timerMinutes),
  );
  const [saved, setSaved] = useState<SavedLog | null>(null);

  if (problem === undefined) {
    return (
      <FocusFrame>
        <p>{t.solving.notFound}</p>
      </FocusFrame>
    );
  }
  const { id } = problem;

  function handleSave(log: ValidLog) {
    const timer = file.activeTimer?.problemId === id ? file.activeTimer : undefined;
    const previous = lastAttempt(file.entries, id) ?? null;
    const completedAt = new Date().toISOString();
    addAttempt({
      problemId: id,
      completedAt,
      date: todayDate,
      rating: log.rating,
      timeMinutes: log.timeMinutes,
      help: log.help,
      ...(timer === undefined ? {} : { startedAt: timer.startedAt }),
      ...(log.keyInsight === "" ? {} : { keyInsight: log.keyInsight }),
      ...(log.notes === "" ? {} : { notes: log.notes }),
    });
    clearTimer();
    setSaved({ log, completedAt, previous });
  }

  // Undo marks the saved attempt deleted, like any delete: the log keeps it, the replay skips it.
  function handleUndo(savedLog: SavedLog) {
    const entry = file.entries.find(
      (candidate) =>
        candidate.type === "attempt" &&
        candidate.problemId === id &&
        candidate.completedAt === savedLog.completedAt,
    );
    if (entry !== undefined) {
      deleteEntry(entry.id);
    }
    setFormValues(toLogValues(savedLog.log));
    setSaved(null);
  }

  if (saved !== null) {
    return <LoggedView problem={problem} saved={saved} onUndo={() => handleUndo(saved)} />;
  }

  const isReview = (states[id]?.status ?? "new") !== "new";
  // Same rule as Solving: on a review the pattern is hidden unless the user opted in.
  const shouldShowPattern = !isReview || file.settings.showPatternOnReviews;
  return (
    <FocusFrame
      back={{ to: `/solve/${id}`, label: t.log.backToTimer }}
      badge={<ProblemKindBadge isReview={isReview} isPatternHidden={!shouldShowPattern} />}
    >
      <title>{t.documentTitle(`${t.pages.logAttempt} ${problem.title}`)}</title>
      <div className="flex flex-col gap-1">
        <Overline>{t.log.label}</Overline>
        <h1 className="font-serif text-3xl font-semibold">{problem.title}</h1>
        {shouldShowPattern && <p className="text-sm text-muted-foreground">{problem.pattern}</p>}
      </div>
      <LogForm
        initialValues={formValues}
        isTimeFromTimer={timerMinutes !== null}
        onSave={handleSave}
      />
    </FocusFrame>
  );
}
