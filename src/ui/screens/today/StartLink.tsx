import { Link } from "react-router";

import type { Problem } from "@/domain/types";
import { Button } from "@/ui/primitives/button";
import { t } from "@/ui/shared/strings";

const BUTTON_PROPS = {
  primary: { variant: "default", className: "px-5" },
  outline: { variant: "outline", className: "px-5 text-primary" },
  muted: { variant: "outline", className: "px-5 text-muted-foreground" },
} as const;

export interface StartLinkProps {
  problem: Problem;
  variant: keyof typeof BUTTON_PROPS;
}

/** "Start" as a link to the Solving screen, named with the problem for screen readers. */
export function StartLink({ problem, variant }: StartLinkProps) {
  return (
    <Button asChild {...BUTTON_PROPS[variant]}>
      <Link to={`/solve/${problem.id}`}>
        {t.today.start} <span className="sr-only">{problem.title}</span>
      </Link>
    </Button>
  );
}
