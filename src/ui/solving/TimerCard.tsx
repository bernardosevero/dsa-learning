import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";

import type { Difficulty } from "@/domain/types";
import { Card } from "@/ui/components/ui/card";
import { formatElapsed } from "@/ui/format";
import { cn } from "@/ui/lib/utils";
import { t } from "@/ui/strings";

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
}

/** Elapsed time against the time box. Guidance only: going over changes the color, nothing stops. */
export function TimerCard({ startedAt, timeBoxMinutes, difficulty }: TimerCardProps) {
  const elapsed = useNow() - Date.parse(startedAt);
  const timeBox = timeBoxMinutes * MILLISECONDS_PER_MINUTE;
  const isOver = elapsed > timeBox;
  // Past the time box the bar is full: the box keeps its green share and the overflow turns ochre.
  const boxShare = isOver ? timeBox / elapsed : Math.max(0, elapsed) / timeBox;
  const minutesOver = Math.max(1, Math.floor((elapsed - timeBox) / MILLISECONDS_PER_MINUTE));

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
      <p className="text-sm text-muted-foreground">{t.solving.timeBoxCaption[difficulty]}</p>
      {isOver && (
        <p className="flex items-center gap-2 text-sm text-rating-medium">
          <ClockIcon aria-hidden className="size-4 shrink-0" />
          {t.solving.overTimeBox(minutesOver)}
        </p>
      )}
    </Card>
  );
}
