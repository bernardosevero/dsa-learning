import { Link } from "react-router";

import { Button } from "@/ui/primitives/button";
import { ExternalLink } from "@/ui/shared/ExternalLink";
import { IntervalTable } from "@/ui/shared/IntervalTable";
import { StartPracticingLink } from "@/ui/shared/StartPracticingLink";
import { t } from "@/ui/shared/strings";

import { MasteryStates } from "./MasteryStates";
import { PageContents } from "./PageContents";
import { QuestionSection } from "./QuestionSection";
import { ResearchSources } from "./ResearchSources";
import { RiskExample } from "./RiskExample";
import { SECTION_IDS, toSectionNumber } from "./sections";
import { SpoilerExample } from "./SpoilerExample";

const NEETCODE_URL = "https://neetcode.io/practice";
const LEETCODE_URL = "https://leetcode.com/problemset/";
const TEXT_LINK_CLASS = "text-primary underline";
// ExternalLink is a 44px button by default; inside a sentence it must flow like the words around it.
const INLINE_EXTERNAL_LINK_CLASS =
  "inline min-h-0 p-0 has-[>svg]:px-0 text-base whitespace-normal underline [&_svg]:ml-0.5 [&_svg]:inline [&_svg]:align-baseline";
const PAGE_GUTTER = "px-[clamp(16px,4vw,40px)]";

const { today, solving, intervals, mastery, spoilers, research, account } = t.howItWorks;

/**
 * The public "how it works" page: the method as direct answers to the questions people ask, with
 * page contents beside them, small worked examples and the research behind it. It renders outside
 * the practice app and reads no save.
 */
export function HowItWorksPage() {
  return (
    <div className={`mx-auto max-w-[1120px] ${PAGE_GUTTER}`}>
      <div className="flex max-w-[760px] flex-col gap-4.5 border-b pt-[clamp(40px,6vw,80px)] pb-[clamp(32px,5vw,56px)]">
        <p className="font-mono text-[13px] tracking-[0.08em] text-muted-foreground uppercase">
          {t.howItWorks.eyebrow}
        </p>
        <h1 className="font-serif text-[clamp(38px,5.4vw,60px)] leading-[1.05] font-medium tracking-[-0.02em] text-balance">
          {t.howItWorks.title}
        </h1>
        <p className="text-lg">
          {t.howItWorks.intro} {t.howItWorks.introMore}
        </p>
      </div>
      <div className="flex flex-wrap items-start gap-x-16 gap-y-10 pt-[clamp(32px,5vw,56px)] pb-[clamp(56px,7vw,96px)]">
        <PageContents />
        <div className="flex max-w-[720px] min-w-0 flex-[999_1_560px] flex-col gap-16">
          <QuestionSection
            id={SECTION_IDS.today}
            number={toSectionNumber("today")}
            question={today.question}
          >
            <p>{today.reviews}</p>
            <RiskExample />
            <p>{today.newProblem}</p>
            <p>{today.noLimits}</p>
          </QuestionSection>
          <QuestionSection
            id={SECTION_IDS.solving}
            number={toSectionNumber("solving")}
            question={solving.question}
          >
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
          <QuestionSection
            id={SECTION_IDS.intervals}
            number={toSectionNumber("intervals")}
            question={intervals.question}
          >
            <IntervalTable />
            <p>{intervals.calendarDays}</p>
            <p>{intervals.timeAndHelp}</p>
            <p>{intervals.overdue}</p>
          </QuestionSection>
          <QuestionSection
            id={SECTION_IDS.mastery}
            number={toSectionNumber("mastery")}
            question={mastery.question}
          >
            <p>{mastery.rule}</p>
            <MasteryStates />
            <p>{mastery.manual}</p>
            <p className="text-muted-foreground">{mastery.label}</p>
          </QuestionSection>
          <QuestionSection
            id={SECTION_IDS.spoilers}
            number={toSectionNumber("spoilers")}
            question={spoilers.question}
          >
            <p>{spoilers.retrieval}</p>
            <SpoilerExample />
            <p>{spoilers.hidden}</p>
            <p>{spoilers.exceptions}</p>
          </QuestionSection>
          <QuestionSection
            id={SECTION_IDS.research}
            number={toSectionNumber("research")}
            question={research.question}
          >
            <p>{research.intro}</p>
            <ResearchSources />
            <aside
              aria-labelledby="how-limits"
              className="flex flex-col gap-1.5 rounded-xl bg-secondary px-5.5 py-5"
            >
              <p id="how-limits" className="font-semibold">
                {t.howItWorks.limitsTitle}
              </p>
              <p className="text-[15px] text-muted-foreground">{research.limits}</p>
            </aside>
          </QuestionSection>
          <QuestionSection
            id={SECTION_IDS.account}
            number={toSectionNumber("account")}
            question={account.question}
          >
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
          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-8">
            <p className="font-serif text-[26px]">{t.howItWorks.closing}</p>
            <div className="flex flex-wrap gap-2.5">
              <StartPracticingLink placement="footer" />
              <Button asChild variant="outline">
                <Link to="/">{t.howItWorks.backToHome}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
