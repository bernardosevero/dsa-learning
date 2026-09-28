import { useState } from "react";
import { useParams, useSearchParams } from "react-router";

import { useAppData } from "@/ui/AppData";
import { FocusFrame } from "@/ui/components/FocusFrame";
import { t } from "@/ui/strings";

import { initialLogValues, minutesSince } from "./logForm";
import { LogScreen } from "./LogScreen";

/** The Log route: prefills the time from this problem's timer and the help from `?help=`. */
export function LogPage() {
  const { problemId } = useParams();
  const [searchParams] = useSearchParams();
  const { problems, file } = useAppData();
  const problem = problems.find((candidate) => candidate.id === problemId);
  // Read once on arrival: saving clears the timer, and the form must keep what it started with.
  const [timerMinutes] = useState(() => {
    const timer = file.activeTimer;
    if (timer === undefined || timer.problemId !== problemId) {
      return null;
    }
    return minutesSince(timer.startedAt, new Date());
  });

  if (problem === undefined) {
    return (
      <FocusFrame>
        <p>{t.solving.notFound}</p>
      </FocusFrame>
    );
  }
  return (
    <LogScreen
      problem={problem}
      initialValues={initialLogValues(searchParams.get("help"), timerMinutes)}
      isTimeFromTimer={timerMinutes !== null}
    />
  );
}
