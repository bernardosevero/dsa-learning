import type { ReactNode } from "react";

export interface QuestionSectionProps {
  /** Lets the section name itself with aria-labelledby, and the page contents link to it. */
  id: string;
  /** Its place in the page contents, e.g. "01". */
  number: string;
  question: string;
  children: ReactNode;
}

/** One question and its answer, in the HTML as plain text so it reads without JavaScript. */
export function QuestionSection({ id, number, question, children }: QuestionSectionProps) {
  return (
    <section aria-labelledby={id} className="flex scroll-mt-6 flex-col gap-3.5">
      <span aria-hidden className="font-mono text-[13px] text-primary">
        {number}
      </span>
      <h2 id={id} className="font-serif text-[32px] leading-tight font-medium">
        {question}
      </h2>
      {children}
    </section>
  );
}
