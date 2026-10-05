import { Link } from "react-router";

import { Button } from "@/ui/primitives/button";
import { t } from "@/ui/shared/strings";

export interface StartPracticingLinkProps {
  /** Where on the page the link sits, so the funnel analytics can tell the two apart. */
  placement: "hero" | "footer";
}

/** "Start practicing": the public pages' primary link into Today. */
export function StartPracticingLink({ placement }: StartPracticingLinkProps) {
  return (
    <Button asChild className="px-5">
      <Link to="/today" data-placement={placement}>
        {t.landing.startPracticing}
      </Link>
    </Button>
  );
}
