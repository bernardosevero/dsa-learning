import { Link } from "react-router";

import { t } from "@/ui/shared/strings";

const { research } = t.landing;

/** A dark band with the two research ideas behind re-solving, and the honest limits. */
export function ResearchBand() {
  return (
    <section aria-labelledby="landing-research" className="bg-foreground text-background">
      <div className="mx-auto flex max-w-[1120px] flex-wrap gap-x-16 gap-y-10 px-[clamp(16px,4vw,40px)] py-[clamp(56px,7vw,96px)]">
        <div className="flex flex-[1_1_340px] flex-col items-start gap-4">
          <p className="font-mono text-[13px] tracking-[0.08em] uppercase opacity-75">
            {research.eyebrow}
          </p>
          <h2
            id="landing-research"
            className="font-serif text-[clamp(30px,4vw,44px)] leading-[1.1] font-medium tracking-[-0.01em]"
          >
            {research.title}
          </h2>
          <p className="opacity-85">{research.body}</p>
          <Link
            to="/how-it-works#how-research"
            className="inline-flex min-h-11 items-center font-medium underline"
          >
            {research.more}
          </Link>
        </div>
        <div className="grid flex-[1.4_1_420px] grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5">
          {research.findings.map((finding) => (
            <figure
              key={finding.name}
              className="flex flex-col gap-2.5 border-t border-background/30 pt-5"
            >
              <p className="font-serif text-[28px]">{finding.name}</p>
              <blockquote>{finding.summary}</blockquote>
              <figcaption className="font-mono text-[13px] opacity-75">{finding.source}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
