import { ExternalLink } from "./ExternalLink";
import { SocialIcon } from "./SocialIcon";
import { t } from "./strings";

const GITHUB_URL = "https://github.com/bernardosevero";
const LINKEDIN_URL = "https://linkedin.com/in/bernardosevero";

/** Author credit and profile links shared by every screen's sheet. */
export function SiteFooter() {
  return (
    <footer
      aria-label={t.footer.label}
      className="flex flex-col items-center gap-3 px-5 pt-6 pb-24 text-center text-sm text-muted-foreground nav:pb-8 sheet:px-8"
    >
      <p>
        <span aria-hidden>{t.footer.credit}</span>
        <span className="sr-only">{t.footer.accessibleCredit}</span>
      </p>
      <div className="flex items-center gap-1">
        <ExternalLink href={GITHUB_URL} variant="ghost" isIconOnly label={t.footer.github}>
          <SocialIcon platform="github" />
        </ExternalLink>
        <ExternalLink href={LINKEDIN_URL} variant="ghost" isIconOnly label={t.footer.linkedin}>
          <SocialIcon platform="linkedin" />
        </ExternalLink>
      </div>
    </footer>
  );
}
