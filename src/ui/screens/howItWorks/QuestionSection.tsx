import type { ReactNode } from "react";

export interface QuestionSectionProps {
  /** Lets the section name itself with aria-labelledby. */
  id: string;
  question: string;
  children: ReactNode;
}

/** One question and its answer, in the HTML as plain text so it reads without JavaScript. */
export function QuestionSection({ id, question, children }: QuestionSectionProps) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="font-serif text-2xl font-semibold">
        {question}
      </h2>
      {children}
    </section>
  );
}
