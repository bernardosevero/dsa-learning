import { ArrowUpRightIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/ui/primitives/button";
import { cn } from "@/ui/primitives/cn";
import { t } from "@/ui/shared/strings";

export interface ExternalLinkProps {
  href: string;
  /** A text link by default; "default" makes it the primary button, "outline" a secondary one. */
  variant?: "link" | "default" | "outline" | "ghost";
  /** Hides the arrow and gives an icon link a 44px target. */
  isIconOnly?: boolean;
  /** Names an icon-only link for assistive technology. */
  label?: string;
  className?: string;
  children: ReactNode;
}

/** A link that opens another site in a new tab, announced aloud and marked with ↗ on text links. */
export function ExternalLink({
  href,
  variant = "link",
  isIconOnly = false,
  label,
  className,
  children,
}: ExternalLinkProps) {
  return (
    <Button
      asChild
      variant={variant}
      className={cn(variant === "link" && "gap-1 px-0", isIconOnly && "size-11 p-0", className)}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label === undefined ? undefined : `${label} ${t.opensInNewTab}`}
      >
        {children}
        {!isIconOnly && <ArrowUpRightIcon aria-hidden />}
        {label === undefined && <span className="sr-only"> {t.opensInNewTab}</span>}
      </a>
    </Button>
  );
}
