import { Link } from "react-router";

import { Button } from "@/ui/primitives/button";
import { ExternalLink } from "@/ui/shared/ExternalLink";
import { IntervalTable } from "@/ui/shared/IntervalTable";
import { StartPracticingLink } from "@/ui/shared/StartPracticingLink";
import { t } from "@/ui/shared/strings";

import { QuestionSection } from "./QuestionSection";
import { ResearchSources } from "./ResearchSources";

const NEETCODE_URL = "https://neetcode.io/practice";
const LEETCODE_URL = "https://leetcode.com/problemset/";
const TEXT_LINK_CLASS = "text-primary underline";
// ExternalLink is a 44px button by default; inside a sentence it must flow like the words around it.
const INLINE_EXTERNAL_LINK_CLASS =
  "inline min-h-0 p-0 has-[>svg]:px-0 text-base whitespace-normal underline [&_svg]:ml-0.5 [&_svg]:inline [&_svg]:align-baseline";

const { today, solving, intervals, mastery, spoilers, research, account } = t.howItWorks;

/**
 * The public "how it works" page: the method as direct answers to the questions people ask, with
 * the research behind it. It renders outside the practice app and reads no save.
 */
export function HowItWorksPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl font-semibold text-balance">{t.howItWorks.title}</h1>
        <p className="text-lg">{t.howItWorks.intro}</p>
      </div>
      <QuestionSection id="how-today" question={today.question}>
        <p>{today.reviews}</p>
        <p>{today.newProblem}</p>
        <p>{today.noLimits}</p>
      </QuestionSection>
      <QuestionSection id="how-solving" question={solving.question}>
        <p>
          {solving.before}{" "}
          <ExternalLink href={NEETCODE_URL} className={INLINE_EXTERNAL_LINK_CLASS}>
            {solving.neetCode}
          </ExternalLink>{" "}
          {solving.between}{" "}
          <ExternalLink href={LEETCODE_URL} className={INLINE_EXTERNAL_LINK_CLASS}>
            {solving.leetCode}
          </ExternalLink>
          {solving.after}
        </p>
      </QuestionSection>
      <QuestionSection id="how-intervals" question={intervals.question}>
        <IntervalTable />
        <p>{intervals.calendarDays}</p>
        <p>{intervals.timeAndHelp}</p>
        <p>{intervals.overdue}</p>
      </QuestionSection>
      <QuestionSection id="how-mastery" question={mastery.question}>
        <p>{mastery.rule}</p>
        <p>{mastery.manual}</p>
        <p className="text-muted-foreground">{mastery.label}</p>
      </QuestionSection>
      <QuestionSection id="how-spoilers" question={spoilers.question}>
        <p>{spoilers.retrieval}</p>
        <p>{spoilers.hidden}</p>
        <p>{spoilers.exceptions}</p>
      </QuestionSection>
      <QuestionSection id="how-research" question={research.question}>
        <p>{research.intro}</p>
        <ResearchSources />
        <p className="text-muted-foreground">{research.limits}</p>
      </QuestionSection>
      <QuestionSection id="how-account" question={account.question}>
        <p>{account.local}</p>
        <p>
          {account.backupBefore}{" "}
          <Link to="/settings" className={TEXT_LINK_CLASS}>
            {account.settingsLink}
          </Link>
          {account.backupAfter}
        </p>
        <p>{account.optionalAccount}</p>
        <p>
          {account.privacyBefore}{" "}
          <Link to="/privacy" className={TEXT_LINK_CLASS}>
            {account.privacyLink}
          </Link>
          {account.privacyAfter}
        </p>
      </QuestionSection>
      <div className="flex flex-col items-center gap-2">
        <StartPracticingLink placement="footer" />
        <Button asChild variant="link">
          <Link to="/">{t.howItWorks.backToHome}</Link>
        </Button>
      </div>
    </div>
  );
}
