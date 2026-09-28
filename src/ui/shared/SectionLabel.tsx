import type { ReactNode } from "react";

import { Overline } from "@/ui/shared/Overline";

export interface SectionLabelProps {
  /** Lets the section name itself with aria-labelledby. */
  id: string;
  children: ReactNode;
  /** Shown on the right, e.g. an estimate or topic progress. */
  aside?: ReactNode;
  /** Extra classes for the label itself, e.g. the Danger zone's destructive color. */
  className?: string;
}

/** The heading above a section, with an optional detail on the right. */
export function SectionLabel({ id, children, aside, className }: SectionLabelProps) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <Overline as="h2" id={id} className={className}>
        {children}
      </Overline>
      {aside}
    </div>
  );
}
