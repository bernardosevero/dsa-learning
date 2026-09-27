import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface NoteBoxProps {
  Icon: LucideIcon;
  children: ReactNode;
}

/** A gentle, muted note, e.g. the backlog note or the review tip. */
export function NoteBox({ Icon, children }: NoteBoxProps) {
  return (
    <div className="flex gap-3 rounded-xl bg-muted p-4 text-sm">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p>{children}</p>
    </div>
  );
}
