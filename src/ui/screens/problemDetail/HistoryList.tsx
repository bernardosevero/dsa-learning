import { Trash2Icon } from "lucide-react";
import { useId, useState } from "react";

import { timeTrend } from "@/domain/history";
import type { Attempt, Entry } from "@/domain/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/primitives/alert-dialog";
import { Badge } from "@/ui/primitives/badge";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { formatMonthDay } from "@/ui/shared/format";
import { RatingChip } from "@/ui/shared/RatingChip";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { t } from "@/ui/shared/strings";

export interface HistoryListProps {
  /** Newest first, without deleted entries. */
  history: readonly Entry[];
  /** While a review is due, earlier insights and notes stay hidden (the spoiler rule). */
  shouldHideNotes: boolean;
  onDelete: (entryId: string) => void;
}

function isAttempt(entry: Entry): entry is Attempt {
  return entry.type === "attempt";
}

function describeDelete(entry: Entry): string {
  const date = formatMonthDay(entry.date);
  return entry.type === "attempt"
    ? t.problemDetail.deleteAttempt(date)
    : t.problemDetail.deleteMark(date);
}

/** S5's history: every attempt and mastered mark, newest first, each one deletable. */
export function HistoryList({ history, shouldHideNotes, onDelete }: HistoryListProps) {
  const headingId = useId();
  const [entryToDelete, setEntryToDelete] = useState<Entry | null>(null);
  const attempts = history.filter(isAttempt);
  const firstAttemptId = attempts.at(-1)?.id;
  const trend = timeTrend(history);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setEntryToDelete(null);
    }
  }

  function handleConfirmDelete() {
    if (entryToDelete !== null) {
      onDelete(entryToDelete.id);
    }
  }

  return (
    <section aria-labelledby={headingId}>
      <SectionLabel
        id={headingId}
        aside={
          trend !== null && (
            <span className="font-mono text-sm text-muted-foreground">
              {t.problemDetail.timeTrend(trend.firstMinutes, trend.latestMinutes)}
            </span>
          )
        }
      >
        {t.problemDetail.history(attempts.length)}
      </SectionLabel>
      {history.length === 0 ? (
        <p className="text-muted-foreground">{t.problemDetail.noHistory}</p>
      ) : (
        <>
          <Card>
            <ol>
              {history.map((entry) => (
                <li key={entry.id} className="flex gap-3 border-b p-4 last:border-b-0">
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    {isAttempt(entry) ? (
                      <AttemptDetails
                        attempt={entry}
                        isFirstTry={entry.id === firstAttemptId}
                        shouldHideNotes={shouldHideNotes}
                      />
                    ) : (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="font-mono text-sm font-medium">
                          {formatMonthDay(entry.date)}
                        </span>
                        <Badge variant="mastered">{t.problemDetail.markedMastered}</Badge>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEntryToDelete(entry)}
                    className="size-11 shrink-0 text-muted-foreground"
                  >
                    <Trash2Icon aria-hidden />
                    <span className="sr-only">{describeDelete(entry)}</span>
                  </Button>
                </li>
              ))}
            </ol>
          </Card>
          <p className="mt-3 text-sm text-muted-foreground">{t.problemDetail.deleteNote}</p>
        </>
      )}
      <AlertDialog open={entryToDelete !== null} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {entryToDelete !== null && t.problemDetail.deleteTitle(describeDelete(entryToDelete))}
            </AlertDialogTitle>
            <AlertDialogDescription>{t.problemDetail.deleteDetail}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.problemDetail.cancel}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleConfirmDelete}>
              {t.problemDetail.confirmDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

interface AttemptDetailsProps {
  attempt: Attempt;
  isFirstTry: boolean;
  shouldHideNotes: boolean;
}

function AttemptDetails({ attempt, isFirstTry, shouldHideNotes }: AttemptDetailsProps) {
  const hasNotes = attempt.keyInsight !== undefined || attempt.notes !== undefined;
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="font-mono text-sm font-medium">{formatMonthDay(attempt.date)}</span>
        <RatingChip rating={attempt.rating} label={t.ratings[attempt.rating]} />
        <span className="font-mono text-sm text-muted-foreground">
          {t.problemDetail.minutes(attempt.timeMinutes)}
        </span>
        <span className="text-sm text-muted-foreground">{t.problemDetail.helps[attempt.help]}</span>
        {isFirstTry && <Badge variant="outline">{t.problemDetail.firstTry}</Badge>}
      </div>
      {shouldHideNotes && hasNotes && (
        <p className="text-sm text-muted-foreground italic">{t.problemDetail.insightHidden}</p>
      )}
      {!shouldHideNotes && attempt.keyInsight !== undefined && (
        <p className="text-sm">{attempt.keyInsight}</p>
      )}
      {!shouldHideNotes && attempt.notes !== undefined && (
        <p className="text-sm text-muted-foreground">{attempt.notes}</p>
      )}
    </>
  );
}
