import { ClockIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import type { Difficulty } from "@/domain/types";
import { Button } from "@/ui/primitives/button";
import { Card } from "@/ui/primitives/card";
import { formatElapsed } from "@/ui/shared/format";
import { cn } from "@/ui/primitives/cn";
import { t } from "@/ui/shared/strings";

const TICK_MILLISECONDS = 1000;
const MILLISECONDS_PER_MINUTE = 60_000;

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), TICK_MILLISECONDS);
    return () => clearInterval(intervalId);
  }, []);
  return now;
}

export interface TimerCardProps {
  /** ISO time the timer started, read from the save file so a reload keeps it. */
  startedAt: string;
  timeBoxMinutes: number;
  difficulty: Difficulty;
  /** Starts the timer over from now, once the user confirmed. */
  onRestart: () => void;
}

/** Elapsed time against the time box. Guidance only: going over changes the color, nothing stops. */
export function TimerCard({ startedAt, timeBoxMinutes, difficulty, onRestart }: TimerCardProps) {
  const [isAskingRestart, setIsAskingRestart] = useState(false);
  const restartButtonRef = useRef<HTMLButtonElement>(null);
  const elapsed = useNow() - Date.parse(startedAt);
  const timeBox = timeBoxMinutes * MILLISECONDS_PER_MINUTE;
  const isOver = elapsed > timeBox;
  // Past the time box the bar is full: the box keeps its green share and the overflow turns ochre.
  const boxShare = isOver ? timeBox / elapsed : Math.max(0, elapsed) / timeBox;
  const minutesOver = Math.max(1, Math.floor((elapsed - timeBox) / MILLISECONDS_PER_MINUTE));

  function closeRestartQuestion() {
    setIsAskingRestart(false);
    restartButtonRef.current?.focus();
  }

  function handleConfirmRestart() {
    onRestart();
    closeRestartQuestion();
  }

  return (
    <Card className={cn("gap-3 p-5", isOver && "border-rating-medium")}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-6xl">{formatElapsed(elapsed)}</span>
        <span className="font-mono text-muted-foreground">
          {t.solving.timeBoxOf(formatElapsed(timeBox))}
        </span>
      </div>
      <div aria-hidden className="flex h-1.5 overflow-hidden rounded-full bg-border">
        <div className="bg-primary" style={{ width: `${boxShare * 100}%` }} />
        {isOver && <div className="flex-1 bg-rating-medium" />}
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t.solving.timeBoxCaption[difficulty]}</p>
        <Button
          ref={restartButtonRef}
          type="button"
          variant="ghost"
          size="lg"
          className="px-3 text-muted-foreground"
          onClick={() => setIsAskingRestart(true)}
        >
          <RotateCcwIcon aria-hidden />
          {t.solving.restart}
        </Button>
      </div>
      {isAskingRestart && (
        <RestartQuestion
          elapsed={formatElapsed(elapsed)}
          onKeep={closeRestartQuestion}
          onRestart={handleConfirmRestart}
        />
      )}
      {isOver && (
        <p className="flex items-center gap-2 text-sm text-rating-medium">
          <ClockIcon aria-hidden className="size-4 shrink-0" />
          {t.solving.overTimeBox(minutesOver)}
        </p>
      )}
    </Card>
  );
}

// Focuses the question's Keep button as it appears: the user lands on the question, and a stray
// Enter keeps the time.
function focusOnMount(element: HTMLElement | null) {
  element?.focus();
}

interface RestartQuestionProps {
  /** The time so far, already formatted, that a restart drops. */
  elapsed: string;
  onKeep: () => void;
  onRestart: () => void;
}

/** Asked inline before a restart, so a single misclick can't lose the time. Escape means Keep. */
function RestartQuestion({ elapsed, onKeep, onRestart }: RestartQuestionProps) {
  const questionId = useId();

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      onKeep();
    }
  }

  return (
    <div
      role="group"
      aria-labelledby={questionId}
      className="flex flex-col gap-3 rounded-lg bg-muted p-3 text-sm sm:flex-row sm:items-center"
    >
      <p id={questionId} className="flex-1">
        {t.solving.restartQuestion} {t.solving.restartDrops(elapsed)}
      </p>
      <div className="flex gap-2">
        <Button
          ref={focusOnMount}
          type="button"
          variant="outline"
          onClick={onKeep}
          onKeyDown={handleKeyDown}
        >
          {t.solving.keep}
        </Button>
        <Button type="button" onClick={onRestart} onKeyDown={handleKeyDown} variant="dark">
          {t.solving.confirmRestart}
        </Button>
      </div>
    </div>
  );
}
