import { ExternalLink } from "./ExternalLink";
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
          <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="currentColor">
            <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.8 10.8 0 0 1 5.62 0c2.15-1.45 3.09-1.15 3.09-1.15.62 1.55.23 2.7.12 2.98.72.79 1.15 1.8 1.15 3.02 0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.03.76 2.08v3.11c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75Z" />
          </svg>
        </ExternalLink>
        <ExternalLink href={LINKEDIN_URL} variant="ghost" isIconOnly label={t.footer.linkedin}>
          <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="currentColor">
            <path d="M20.45 2H3.55C2.69 2 2 2.68 2 3.52v16.96c0 .84.69 1.52 1.55 1.52h16.9c.86 0 1.55-.68 1.55-1.52V3.52c0-.84-.69-1.52-1.55-1.52ZM7.93 18.75H4.97V9.2h2.96v9.55ZM6.45 7.89a1.72 1.72 0 1 1 0-3.44 1.72 1.72 0 0 1 0 3.44Zm12.3 10.86h-2.96V14.1c0-1.1-.02-2.52-1.53-2.52-1.54 0-1.78 1.2-1.78 2.44v4.73H9.52V9.2h2.84v1.3h.04c.4-.75 1.36-1.54 2.8-1.54 3 0 3.55 1.98 3.55 4.55v5.24Z" />
          </svg>
        </ExternalLink>
      </div>
    </footer>
  );
}
