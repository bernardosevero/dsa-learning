import { t } from "@/ui/shared/strings";

import { SECTION_IDS, SECTION_ORDER, toSectionNumber } from "./sections";

const { contents } = t.howItWorks;

/** "On this page": a link to each question. It stacks above the answers on a phone. */
export function PageContents() {
  return (
    <nav aria-labelledby="how-contents" className="flex flex-[1_1_220px] flex-col gap-0.5">
      <p
        id="how-contents"
        className="mb-2 font-mono text-xs tracking-[0.08em] text-muted-foreground uppercase"
      >
        {contents.label}
      </p>
      {SECTION_ORDER.map((key) => (
        <a
          key={key}
          href={`#${SECTION_IDS[key]}`}
          className="flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-[15px] outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span aria-hidden className="font-mono text-xs text-muted-foreground">
            {toSectionNumber(key)}
          </span>
          {contents[key]}
        </a>
      ))}
    </nav>
  );
}
