import type { ReactNode } from "react";

import { cn } from "@/ui/primitives/cn";

import { SiteFooter } from "./SiteFooter";

export interface PageSheetProps {
  /** The top bar: it spans the sheet, with a rule under it. */
  header: ReactNode;
  /** Keeps the content to a 656px column when the sheet is wider, for screens of text and forms. */
  isReadable?: boolean;
  /** Extra classes for the content, e.g. the gap between sections. */
  contentClassName?: string;
  children: ReactNode;
}

/**
 * The frame every screen sits in, the same width on all of them so moving between screens never
 * resizes it: up to 640px in a narrow window, a 720px sheet from `sheet`, 1040px from `wide`.
 */
export function PageSheet({ header, isReadable, contentClassName, children }: PageSheetProps) {
  return (
    <div className="flex min-h-svh flex-col">
      <div
        className={cn(
          // Below `sheet` the old 640px cap stays, so the window beside NeetCode is unchanged.
          "mx-auto flex w-full max-w-[640px] flex-1 flex-col bg-background",
          "sheet:mt-8 sheet:max-w-[720px]",
          "sheet:rounded-2xl sheet:border wide:max-w-[1040px]",
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b px-5 py-4 sheet:px-8">
          {header}
        </header>
        <main className="flex-1 px-5 pt-4 pb-8 sheet:px-8">
          {/* 656px is the content width of the 720px sheet, so readable screens look the same. */}
          <div className={cn(isReadable && "mx-auto w-full max-w-[656px]", contentClassName)}>
            {children}
          </div>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
