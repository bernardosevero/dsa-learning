import { ArrowUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/ui/primitives/button";
import { cn } from "@/ui/primitives/cn";
import { t } from "@/ui/shared/strings";

export interface ExternalLinkProps {
  href: string;
  /** A text link by default; "default" makes it the primary button, "outline" a secondary one. */
  variant?: "link" | "default" | "outline";
  className?: string;
  children: ReactNode;
}

/** A link that opens another site in a new tab, marked with ↗ and said out loud. */
export function ExternalLink({ href, variant = "link", className, children }: ExternalLinkProps) {
  return (
    <Button asChild variant={variant} className={cn(variant === "link" && "gap-1 px-0", className)}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
        <ArrowUpRightIcon aria-hidden />
        <span className="sr-only"> {t.opensInNewTab}</span>
      </a>
    </Button>
  );
}
