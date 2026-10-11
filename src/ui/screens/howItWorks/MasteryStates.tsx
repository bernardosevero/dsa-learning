import { ArrowRightIcon } from "lucide-react";

import { cn } from "@/ui/primitives/cn";
import { t } from "@/ui/shared/strings";

const { masteryStates } = t.howItWorks;

interface StateBoxProps {
  name: string;
  body: string;
  className: string;
  nameClassName: string;
}

function StateBox({ name, body, className, nameClassName }: StateBoxProps) {
  return (
    <li
      className={cn(
        "flex flex-[1_1_140px] flex-col gap-1 rounded-xl border px-4 py-3.5",
        className,
      )}
    >
      <span className={cn("font-mono text-xs tracking-[0.06em] uppercase", nameClassName)}>
        {name}
      </span>
      <span className="text-sm">{body}</span>
    </li>
  );
}

interface TransitionProps {
  label: string;
}

function Transition({ label }: TransitionProps) {
  return (
    <li className="flex flex-col items-center justify-center gap-0.5 px-1 text-center text-xs text-muted-foreground">
      <ArrowRightIcon aria-hidden className="size-5" />
      <span className="max-w-[9em]">{label}</span>
    </li>
  );
}

/** New → Active → Mastered, with what moves a problem along, built from text rather than a picture. */
export function MasteryStates() {
  return (
    <figure className="flex flex-col gap-2.5">
      <ol aria-label={masteryStates.label} className="flex flex-wrap items-stretch gap-2.5">
        <StateBox
          {...masteryStates.new}
          className="bg-card"
          nameClassName="text-muted-foreground"
        />
        <Transition label={masteryStates.anyAttempt} />
        <StateBox
          {...masteryStates.active}
          className="border-accent bg-accent"
          nameClassName="text-accent-foreground"
        />
        <Transition label={masteryStates.easyOnTime} />
        <StateBox
          {...masteryStates.mastered}
          className="border-status-mastered-muted bg-status-mastered-muted"
          nameClassName="text-status-mastered"
        />
      </ol>
      <figcaption className="text-sm text-muted-foreground">{masteryStates.caption}</figcaption>
    </figure>
  );
}
