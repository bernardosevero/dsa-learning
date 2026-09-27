import { Link } from "react-router";

import type { Problem } from "@/domain/types";
import { Button } from "@/ui/components/ui/button";
import { cn } from "@/ui/lib/utils";
import { t } from "@/ui/strings";

const VARIANT_CLASSES = {
  primary: "",
  outline: "bg-card text-primary shadow-none",
  muted: "bg-card text-muted-foreground shadow-none",
} as const;

export interface StartLinkProps {
  problem: Problem;
  variant: keyof typeof VARIANT_CLASSES;
}

/** "Start" as a link to the Solving screen, named with the problem for screen readers. */
export function StartLink({ problem, variant }: StartLinkProps) {
  return (
    <Button
      asChild
      variant={variant === "primary" ? "default" : "outline"}
      className={cn("min-h-11 shrink-0 px-5", VARIANT_CLASSES[variant])}
    >
      <Link to={`/solve/${problem.id}`}>
        {t.today.start} <span className="sr-only">{problem.title}</span>
      </Link>
    </Button>
  );
}
