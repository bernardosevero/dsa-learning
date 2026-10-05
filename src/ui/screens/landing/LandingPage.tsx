import { Link } from "react-router";

import { Button } from "@/ui/primitives/button";
import { ExternalLink } from "@/ui/shared/ExternalLink";
import { SectionLabel } from "@/ui/shared/SectionLabel";
import { t } from "@/ui/shared/strings";

import { IntervalTable } from "./IntervalTable";
import { LandingFaq } from "./LandingFaq";
import { PracticeSteps } from "./PracticeSteps";
import { StartPracticingLink } from "./StartPracticingLink";
import { TODAY_PREVIEW_SIZE } from "./todayPreviewSize";

/**
 * The public landing page: what the app does, a picture of Today with example data, the fixed
 * intervals and three direct answers. It renders outside the practice app and reads no save.
 */
export function LandingPage() {
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="landing-title" className="flex flex-col gap-4">
        <h1 id="landing-title" className="font-serif text-4xl font-semibold text-balance">
          {t.landing.title}
        </h1>
        <p className="text-lg">{t.landing.summary}</p>
        <div className="flex flex-wrap gap-3">
          <StartPracticingLink placement="hero" />
          <Button asChild variant="outline" className="px-5">
            <Link to="/how-it-works">{t.landing.howItWorks}</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">{t.landing.noAccount}</p>
      </section>
      <figure className="flex flex-col items-center gap-2">
        <img
          src="/today-preview.png"
          alt={t.landing.previewAlt}
          width={TODAY_PREVIEW_SIZE.width}
          height={TODAY_PREVIEW_SIZE.height}
          className="h-auto w-full max-w-[400px] rounded-xl border"
        />
        <figcaption className="text-sm text-muted-foreground">
          {t.landing.previewCaption}
        </figcaption>
      </figure>
      <section aria-labelledby="landing-steps">
        <SectionLabel id="landing-steps">{t.landing.stepsTitle}</SectionLabel>
        <PracticeSteps />
      </section>
      <section aria-labelledby="landing-intervals" className="flex flex-col gap-3">
        <SectionLabel id="landing-intervals">{t.landing.intervalsTitle}</SectionLabel>
        <IntervalTable />
        <p className="text-sm text-muted-foreground">{t.landing.intervalsFixed}</p>
        <Link to="/how-it-works" className="text-sm text-primary underline">
          {t.landing.intervalsMore}
        </Link>
      </section>
      <section aria-labelledby="landing-faq">
        <SectionLabel id="landing-faq">{t.landing.faqTitle}</SectionLabel>
        <LandingFaq />
      </section>
      <div className="flex justify-center">
        <StartPracticingLink placement="footer" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
        <p>{t.landing.notAffiliated}</p>
        <div className="flex flex-wrap justify-center gap-x-4">
          <Button asChild variant="link" className="px-0">
            <Link to="/privacy">{t.landing.privacyAndCredits}</Link>
          </Button>
          <ExternalLink href="/NOTICE.md">{t.landing.mitNotice}</ExternalLink>
        </div>
      </div>
    </div>
  );
}
