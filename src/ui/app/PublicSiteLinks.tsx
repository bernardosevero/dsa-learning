import { Link } from "react-router";

import { Button } from "@/ui/primitives/button";
import { ExternalLink } from "@/ui/shared/ExternalLink";
import { t } from "@/ui/shared/strings";

const LINK_CLASS = "px-0 font-normal text-muted-foreground hover:text-foreground";

/** The row above the author footer on public pages: the name, the non-affiliation note, the pages. */
export function PublicSiteLinks() {
  return (
    <div className="border-t">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-start justify-between gap-6 px-[clamp(16px,4vw,40px)] pt-8 pb-2">
        <div className="flex max-w-[36em] flex-[1_1_320px] flex-col gap-2">
          <p className="font-serif text-xl font-semibold">{t.appName}</p>
          <p className="text-sm text-muted-foreground">{t.landing.notAffiliated}</p>
        </div>
        <nav aria-label={t.publicLinks.label} className="flex flex-wrap items-center gap-x-5">
          <Button asChild variant="link" className={LINK_CLASS}>
            <Link to="/how-it-works">{t.shell.howItWorks}</Link>
          </Button>
          <Button asChild variant="link" className={LINK_CLASS}>
            <Link to="/privacy">{t.landing.privacyAndCredits}</Link>
          </Button>
          <ExternalLink href="/NOTICE.md" className={LINK_CLASS}>
            {t.landing.mitNotice}
          </ExternalLink>
        </nav>
      </div>
    </div>
  );
}
