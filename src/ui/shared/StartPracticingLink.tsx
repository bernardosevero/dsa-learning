import { ArrowRightIcon } from "lucide-react";
import { Link, useLocation } from "react-router";

import { Button } from "@/ui/primitives/button";

import {
  toPublicAcquisitionPath,
  trackStartPracticing,
  type StartPracticingPlacement,
} from "./analytics";
import { t } from "./strings";

export interface StartPracticingLinkProps {
  /** Where on the page the link sits, so the funnel analytics can tell the two apart. */
  placement: StartPracticingPlacement;
  /** "outline" is the paper-coloured version for a green surface. */
  variant?: "default" | "outline";
}

/** "Start practicing": the public pages' primary link into Today, counted as an acquisition. */
export function StartPracticingLink({ placement, variant = "default" }: StartPracticingLinkProps) {
  const { pathname } = useLocation();

  function handleClick() {
    const sourcePath = toPublicAcquisitionPath(pathname);
    if (sourcePath !== undefined) {
      trackStartPracticing(sourcePath, placement);
    }
  }

  return (
    <Button asChild variant={variant} className="min-h-12 px-5.5 font-semibold">
      <Link to="/today" data-placement={placement} onClick={handleClick}>
        {t.startPracticing}
        <ArrowRightIcon aria-hidden />
      </Link>
    </Button>
  );
}
