import type { ReactNode } from "react";

export interface SectionLabelProps {
  /** Lets the section name itself with aria-labelledby. */
  id: string;
  children: ReactNode;
  /** Shown on the right, e.g. an estimate or topic progress. */
  aside?: ReactNode;
}

/** The small uppercase heading above a section. */
export function SectionLabel({ id, children, aside }: SectionLabelProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 id={id} className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        {children}
      </h2>
      {aside}
    </div>
  );
}
