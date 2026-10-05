const FONTS_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=swap";

/**
 * The tags every page's <head> starts with. Robots, description, canonical and link-preview tags
 * come from each route's meta (src/ui/shared/publicPageMetadata.ts); pages add their own <title>.
 */
export function DocumentHead() {
  return (
    <>
      <meta charSet="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
