import { lastAttempt } from "@/domain/schedule";
import { useAppData } from "@/ui/AppData";

import type { SavedLog, ValidLog } from "./logForm";

/** Saving a log (then clearing the timer) and undoing that save, for one problem. */
export function useLogActions(problemId: string) {
  const { file, todayDate, addAttempt, clearTimer, deleteEntry } = useAppData();

  function save(log: ValidLog): SavedLog {
    const timer = file.activeTimer?.problemId === problemId ? file.activeTimer : undefined;
    const previous = lastAttempt(file.entries, problemId) ?? null;
    const completedAt = new Date().toISOString();
    addAttempt({
      problemId,
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
    return { log, completedAt, previous };
  }

  // Undo marks the saved attempt deleted, like any delete: the log keeps it, the replay skips it.
  function undo(saved: SavedLog): void {
    const entry = file.entries.find(
      (candidate) =>
        candidate.type === "attempt" &&
        candidate.problemId === problemId &&
        candidate.completedAt === saved.completedAt,
    );
    if (entry !== undefined) {
      deleteEntry(entry.id);
    }
  }

  return { save, undo };
}
