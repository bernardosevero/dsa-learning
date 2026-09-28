import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useId } from "react";

import { Button } from "@/ui/primitives/button";
import { t } from "@/ui/shared/strings";

export interface SpoilerPanelProps {
  /** False when the user chose to see the pattern on reviews. */
  isPatternHidden: boolean;
  insightCount: number;
  onReveal: () => void;
}

/** Says what a due review keeps hidden, and reveals it on request. */
export function SpoilerPanel({ isPatternHidden, insightCount, onReveal }: SpoilerPanelProps) {
  const headingId = useId();
  const insights = t.problemDetail.earlierInsights(insightCount);
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted p-5"
    >
      <div className="flex items-center gap-2.5">
        <EyeOffIcon aria-hidden className="size-4.5 text-muted-foreground" />
        <h2 id={headingId} className="font-semibold">
          {t.problemDetail.spoilerTitle}
        </h2>
      </div>
      <p className="text-sm text-muted-foreground">
        {isPatternHidden
          ? t.problemDetail.hiddenWithPattern(insights)
          : t.problemDetail.hiddenWithoutPattern(insights)}
      </p>
      <Button variant="outline" aria-expanded={false} onClick={onReveal} className="self-start">
        <EyeIcon aria-hidden />
        {t.problemDetail.reveal}
      </Button>
    </section>
  );
}
