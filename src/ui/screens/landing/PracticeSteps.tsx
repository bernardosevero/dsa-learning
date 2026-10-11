import { INTERVAL_DAYS } from "@/domain/schedule";
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
    <ol className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8">
      {STEPS.map((step, index) => (
        <li key={step.title} className="flex flex-col gap-2.5 border-t border-foreground/25 pt-5">
          <span aria-hidden className="font-mono text-[15px] font-medium text-primary">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3 className="font-serif text-[26px] font-medium">{step.title}</h3>
          <p className="text-muted-foreground">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
