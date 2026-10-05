import { Card } from "@/ui/primitives/card";
import { ExternalLink } from "@/ui/shared/ExternalLink";
import { t } from "@/ui/shared/strings";

const { spacing, retrieval, broader } = t.howItWorks.research;

const SOURCES = [
  { ...spacing, url: "https://pubmed.ncbi.nlm.nih.gov/19076480/" },
  { ...retrieval, url: "https://pubmed.ncbi.nlm.nih.gov/16507066/" },
  { ...broader, url: "https://journals.sagepub.com/doi/abs/10.1177/1529100612453266" },
] as const;

/** The three research ideas, each summarized in our words with its original source beside it. */
export function ResearchSources() {
  return (
    <ul className="flex flex-col gap-3">
      {SOURCES.map((source) => (
        <li key={source.title}>
          <Card className="gap-1 p-4">
            <h3 className="font-semibold">{source.title}</h3>
            <p className="text-sm text-muted-foreground">{source.body}</p>
            <ExternalLink href={source.url} className="self-start text-sm">
              {source.source}
            </ExternalLink>
          </Card>
        </li>
      ))}
    </ul>
  );
}
