import { CheckIcon } from "lucide-react";
import { Link } from "react-router";

import { INTERVAL_DAYS } from "@/domain/schedule";
import { Button } from "@/ui/primitives/button";
import { StartPracticingLink } from "@/ui/shared/StartPracticingLink";
import { t } from "@/ui/shared/strings";

import { TODAY_PREVIEW_FILES, TODAY_PREVIEW_SIZE } from "./todayPreviewSize";

const PREVIEW_SRCSET = TODAY_PREVIEW_FILES.map((file) => `${file.path} ${file.width}w`).join(", ");
// The picture fills its column up to 400px; on a phone the page pads each side by at least 16px.
const PREVIEW_SIZES = "(min-width: 440px) 400px, calc(100vw - 32px)";

/** The landing's first screen: what the app is, the two ways in, and a picture of Today. */
export function LandingHero() {
  return (
    <section
      aria-labelledby="landing-title"
      className="mx-auto flex max-w-[1120px] flex-wrap items-center gap-[clamp(40px,6vw,72px)] px-[clamp(16px,4vw,40px)] pt-[clamp(40px,7vw,96px)] pb-[clamp(48px,7vw,88px)]"
    >
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-5.5">
        <p className="font-mono text-[13px] tracking-[0.08em] text-muted-foreground uppercase">
          {t.landing.eyebrow}
        </p>
        <h1
          id="landing-title"
          className="font-serif text-[clamp(40px,6vw,68px)] leading-[1.02] font-medium tracking-[-0.02em] text-balance"
        >
          {t.landing.titleLead}{" "}
          <span className="mt-2.5 block text-[0.62em] leading-[1.15] font-normal text-primary italic">
            {t.landing.title}
          </span>
        </h1>
        <p className="max-w-[34em] text-lg leading-relaxed">
          {t.landing.summary(INTERVAL_DAYS.hard, INTERVAL_DAYS.medium, INTERVAL_DAYS.easy)}
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <StartPracticingLink placement="hero" />
          <Button asChild variant="outline" className="min-h-12 px-5">
            <Link to="/how-it-works">{t.landing.howItWorks}</Link>
          </Button>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {t.landing.promises.map((promise) => (
            <li key={promise} className="inline-flex items-center gap-1.5">
              <CheckIcon aria-hidden className="size-4 text-primary" strokeWidth={2.2} />
              {promise}
            </li>
          ))}
        </ul>
      </div>
      <figure className="mx-auto flex max-w-[400px] min-w-0 flex-[1_1_320px] flex-col items-center gap-2.5">
        <img
          src="/today-preview.webp"
          srcSet={PREVIEW_SRCSET}
          sizes={PREVIEW_SIZES}
          fetchPriority="high"
          alt={t.landing.previewAlt}
          width={TODAY_PREVIEW_SIZE.width}
          height={TODAY_PREVIEW_SIZE.height}
          className="h-auto w-full rounded-2xl border"
        />
        <figcaption className="text-center text-sm text-muted-foreground">
          {t.landing.previewCaption}
        </figcaption>
      </figure>
    </section>
  );
}
