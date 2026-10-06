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
}

/** "Start practicing": the public pages' primary link into Today, counted as an acquisition. */
export function StartPracticingLink({ placement }: StartPracticingLinkProps) {
  const { pathname } = useLocation();

  function handleClick() {
    const sourcePath = toPublicAcquisitionPath(pathname);
    if (sourcePath !== undefined) {
      trackStartPracticing(sourcePath, placement);
    }
  }

  return (
    <Button asChild className="px-5">
      <Link to="/today" data-placement={placement} onClick={handleClick}>
        {t.startPracticing}
      </Link>
    </Button>
  );
}
