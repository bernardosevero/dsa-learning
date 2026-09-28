import { Link } from "react-router";

import type { Problem } from "@/domain/types";
import { useAppData } from "@/ui/AppData";
import { FocusFrame } from "@/ui/components/FocusFrame";
import { RatingChip } from "@/ui/components/RatingChip";
import { Button } from "@/ui/components/ui/button";
import { t } from "@/ui/strings";

import type { SavedLog } from "./logForm";
import { MasteredCard } from "./MasteredCard";
import { NextResolveCard } from "./NextResolveCard";
import { NowRevealed } from "./NowRevealed";

export interface LoggedViewProps {
  problem: Problem;
  saved: SavedLog;
  onUndo: () => void;
}

/** The confirmation after saving: what the schedule does next, then the reveal. */
export function LoggedView({ problem, saved, onUndo }: LoggedViewProps) {
  const { problems, states, todayDate } = useAppData();
  const state = states[problem.id];
  const masteredCount = Object.values(states).filter((each) => each.status === "mastered").length;
  const { rating } = saved.log;

  return (
    <FocusFrame>
      <title>{t.documentTitle(`${t.pages.logAttempt} ${problem.title}`)}</title>
      <div className="flex flex-col items-start gap-2">
        <RatingChip rating={rating} label={t.log.logged(t.ratings[rating])} />
        <h1 className="font-serif text-3xl font-semibold">{problem.title}</h1>
      </div>
      {state?.status === "mastered" && (
        <MasteredCard masteredCount={masteredCount} total={problems.length} />
      )}
      {state?.status === "active" && (
        <NextResolveCard dueDate={state.dueDate} todayDate={todayDate} />
      )}
      <NowRevealed problem={problem} today={saved.log} previous={saved.previous} />
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="min-h-11 flex-1">
          <Link to="/">{t.log.backToToday}</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onUndo}
          className="min-h-11 bg-card shadow-none"
        >
          {t.log.undo}
        </Button>
      </div>
    </FocusFrame>
  );
}
