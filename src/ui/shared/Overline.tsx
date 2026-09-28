import type { ReactNode } from "react";

import { cn } from "@/ui/primitives/cn";

export interface OverlineProps {
  /** A heading when it names a section, a paragraph when it labels a card. */
  as?: "p" | "h2" | "span";
  id?: string;
  className?: string;
  children: ReactNode;
}

/** The small uppercase label design.md uses above sections and inside cards, e.g. "NEXT RE-SOLVE". */
export function Overline({ as: Tag = "p", id, className, children }: OverlineProps) {
  return (
    <Tag
      id={id}
      className={cn(
        "text-xs font-semibold tracking-widest text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
