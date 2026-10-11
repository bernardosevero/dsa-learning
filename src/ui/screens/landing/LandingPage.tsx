import { t } from "@/ui/shared/strings";

import { ClosingCallToAction } from "./ClosingCallToAction";
import { IntervalTiles } from "./IntervalTiles";
import { LandingFaq } from "./LandingFaq";
import { LandingHero } from "./LandingHero";
import { MasteryTimeline } from "./MasteryTimeline";
import { PracticeSteps } from "./PracticeSteps";
import { ResearchBand } from "./ResearchBand";

const CONTAINER = "mx-auto max-w-[1120px] px-[clamp(16px,4vw,40px)] py-[clamp(56px,7vw,96px)]";
const EYEBROW = "font-mono text-[13px] tracking-[0.08em] text-muted-foreground uppercase";
const SECTION_TITLE =
  "font-serif text-[clamp(30px,4vw,44px)] leading-[1.1] font-medium tracking-[-0.01em]";

/**
 * The public landing page, as full-width sections: the hero with a picture of Today, when a
 * problem comes back, the practice loop, the research, questions and a closing link into the app.
 * It renders outside the practice app and reads no save.
 */
export function LandingPage() {
  return (
    <>
      <LandingHero />
      <section aria-labelledby="landing-intervals" className="border-y bg-card">
        <div className={`${CONTAINER} flex flex-col gap-10`}>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
            <div className="flex flex-[1_1_420px] flex-col gap-3">
              <p className={EYEBROW}>{t.landing.intervalsEyebrow}</p>
              <h2 id="landing-intervals" className={SECTION_TITLE}>
                {t.landing.intervalsTitle}
              </h2>
            </div>
            <p className="max-w-[30em] flex-[1_1_320px] text-muted-foreground">
              {t.landing.intervalsFixed}
            </p>
          </div>
          <IntervalTiles />
          <MasteryTimeline />
        </div>
      </section>
      <section aria-labelledby="landing-steps" className={`${CONTAINER} flex flex-col gap-9`}>
        <div className="flex flex-col gap-3">
          <p className={EYEBROW}>{t.landing.stepsEyebrow}</p>
          <h2 id="landing-steps" className={SECTION_TITLE}>
            {t.landing.stepsTitle}
          </h2>
        </div>
        <PracticeSteps />
      </section>
      <ResearchBand />
      <section aria-labelledby="landing-faq" className={CONTAINER}>
        <h2 id="landing-faq" className={`${SECTION_TITLE} mb-6`}>
          {t.landing.faqTitle}
        </h2>
        <LandingFaq />
      </section>
      <ClosingCallToAction />
    </>
  );
}
