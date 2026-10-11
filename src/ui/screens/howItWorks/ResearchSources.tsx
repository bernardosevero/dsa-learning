import { ExternalLink } from "@/ui/shared/ExternalLink";
import { t } from "@/ui/shared/strings";

const { spacing, retrieval, broader } = t.howItWorks.research;

const SOURCES = [
  { ...spacing, url: "https://pubmed.ncbi.nlm.nih.gov/19076480/" },
  { ...retrieval, url: "https://pubmed.ncbi.nlm.nih.gov/16507066/" },
  { ...broader, url: "https://journals.sagepub.com/doi/abs/10.1177/1529100612453266" },
] as const;

/** The three research ideas as a ruled list: each title with its source, beside our summary. */
export function ResearchSources() {
  return (
    <ul className="flex flex-col border-b">
      {SOURCES.map((source) => (
        <li key={source.title} className="flex flex-wrap gap-x-6 gap-y-2 border-t py-5">
          <div className="flex flex-[1_1_160px] flex-col items-start gap-0.5">
            <h3 className="font-serif text-2xl font-medium">{source.title}</h3>
            <ExternalLink href={source.url} className="-my-2.5 font-mono text-[13px]">
              {source.source}
            </ExternalLink>
          </div>
          <p className="flex-[3_1_320px] text-muted-foreground">{source.body}</p>
        </li>
      ))}
    </ul>
  );
}
