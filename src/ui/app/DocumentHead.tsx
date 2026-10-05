import { t } from "@/ui/shared/strings";

const PRODUCTION_URL = "https://dsa-learning.bernardosevero.dev";
const configuredSiteUrl: unknown = import.meta.env.VITE_SITE_URL;
/** The site's address for link previews: VITE_SITE_URL when the build sets it, else production. */
const SITE_URL =
  typeof configuredSiteUrl === "string" && configuredSiteUrl !== ""
    ? configuredSiteUrl
    : PRODUCTION_URL;
const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap";

/**
 * The tags every page's <head> starts with. Link unfurlers don't run JavaScript, so the preview
 * tags are in the HTML the build writes. Pages add their own <title>.
 */
export function DocumentHead() {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="noindex" />
      <meta name="description" content={t.meta.description} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={t.appName} />
      <meta property="og:title" content={t.meta.title} />
      <meta property="og:description" content={t.meta.description} />
      <meta property="og:url" content={`${SITE_URL}/`} />
      <meta property="og:image" content={OG_IMAGE_URL} />
      <meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
      <meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
      <meta property="og:image:alt" content={t.meta.imageAlt} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={t.meta.title} />
      <meta name="twitter:description" content={t.meta.description} />
      <meta name="twitter:image" content={OG_IMAGE_URL} />
      <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      {/* The --background token of each theme in src/index.css. */}
      <meta name="theme-color" content="#f6f4ee" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#141513" media="(prefers-color-scheme: dark)" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={FONTS_URL} />
    </>
  );
}
