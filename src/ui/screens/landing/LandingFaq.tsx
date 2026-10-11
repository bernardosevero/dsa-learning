import { ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";

import { INTERVAL_DAYS } from "@/domain/schedule";
import { t } from "@/ui/shared/strings";

const { dsaForJobs, whyResolve, neetCode150, perDay, platform, account, storage } = t.landing.faqs;

interface FaqItemProps {
  question: string;
  isOpen?: boolean;
  children: ReactNode;
}

/**
 * One question as a native disclosure. Unlike a Radix accordion, a closed <details> keeps its
 * answer in the prerendered HTML and works without JavaScript, which is what answer engines read.
 */
function FaqItem({ question, isOpen = false, children }: FaqItemProps) {
  return (
    <details open={isOpen} className="group border-t">
      <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-2 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <h3 className="text-[17px] leading-snug font-semibold group-hover:text-primary">
          {question}
        </h3>
        <ChevronDownIcon
          aria-hidden
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-2.5 pr-9 pb-5.5 text-muted-foreground">{children}</div>
    </details>
  );
}

/** Seven direct answers as dropdowns, every answer in the HTML even while closed. */
export function LandingFaq() {
  return (
    <div className="flex min-w-0 flex-[2_1_480px] flex-col border-b">
      <FaqItem question={dsaForJobs.question} isOpen>
        {dsaForJobs.answers.map((answer) => (
          <p key={answer}>{answer}</p>
        ))}
      </FaqItem>
      <FaqItem question={whyResolve.question}>
        <p>{whyResolve.answer(INTERVAL_DAYS.hard, INTERVAL_DAYS.medium, INTERVAL_DAYS.easy)}</p>
      </FaqItem>
      <FaqItem question={neetCode150.question}>
        <p>{neetCode150.answer}</p>
      </FaqItem>
      <FaqItem question={perDay.question}>
        <p>{perDay.answer}</p>
      </FaqItem>
      <FaqItem question={platform.question}>
        <p>{platform.answer}</p>
      </FaqItem>
      <FaqItem question={account.question}>
        <p>{account.answer}</p>
      </FaqItem>
      <FaqItem question={storage.question}>
        <p>
          {storage.answerBefore}{" "}
          <Link to="/privacy" className="text-primary underline">
            {storage.privacyLink}
          </Link>
          {storage.answerAfter}
        </p>
      </FaqItem>
    </div>
  );
}
