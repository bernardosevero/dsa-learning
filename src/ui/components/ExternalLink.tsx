import { ArrowUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";

import { t } from "@/ui/strings";

export interface ExternalLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

/** A link that opens another site in a new tab, marked with ↗ and said out loud. */
export function ExternalLink({ href, className, children }: ExternalLinkProps) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <ArrowUpRightIcon aria-hidden className="size-4" />
      <span className="sr-only"> {t.opensInNewTab}</span>
    </a>
  );
}
