import type { ReactNode } from "react";

import { cn } from "@/ui/primitives/cn";

export interface PageSheetProps {
  /** The top bar: it spans the sheet, with a rule under it. */
  header: ReactNode;
  /** Today only: from the `wide` breakpoint its sheet grows to hold the sidebar. */
  isWide?: boolean;
  /** Extra classes for `<main>`, e.g. the gap between sections. */
  mainClassName?: string;
  children: ReactNode;
}

/**
 * The frame every screen sits in. In a narrow window it's the old column (up to 640px); from
 * the `sheet` breakpoint it becomes a 720px bordered sheet on the darker desk.
 */
export function PageSheet({ header, isWide, mainClassName, children }: PageSheetProps) {
  return (
    <div
      className={cn(
        // Below `sheet` the old 640px cap stays, so the window beside NeetCode is unchanged.
        "mx-auto flex min-h-svh w-full max-w-[640px] flex-col bg-background",
        "sheet:my-8 sheet:min-h-[calc(100svh-4rem)] sheet:max-w-[720px]",
        "sheet:rounded-2xl sheet:border",
        isWide && "wide:max-w-[1040px]",
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b px-5 py-4 sheet:px-8">
        {header}
      </header>
      <main className={cn("flex-1 px-5 pt-4 pb-8 sheet:px-8", mainClassName)}>{children}</main>
    </div>
  );
}
