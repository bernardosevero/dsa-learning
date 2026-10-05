import { INTERVAL_DAYS } from "@/domain/schedule";
import { Card } from "@/ui/primitives/card";
import { t } from "@/ui/shared/strings";

const STEPS = [
  t.landing.steps.due,
  t.landing.steps.solve,
  {
    title: t.landing.steps.resolve.title,
    body: t.landing.steps.resolve.body(
      INTERVAL_DAYS.hard,
      INTERVAL_DAYS.medium,
      INTERVAL_DAYS.easy,
    ),
  },
] as const;

/** The practice loop in three numbered steps: see what is due, solve and log, re-solve later. */
export function PracticeSteps() {
  return (
    <ol className="flex flex-col gap-3">
      {STEPS.map((step, index) => (
        <li key={step.title}>
          <Card className="h-full gap-1 p-4">
            <h3 className="flex gap-2 font-semibold">
              <span aria-hidden className="font-mono text-muted-foreground">
                {index + 1}
              </span>
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground">{step.body}</p>
          </Card>
        </li>
      ))}
    </ol>
  );
}
