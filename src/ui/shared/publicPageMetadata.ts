import type { MetaDescriptor } from "react-router";

import { t } from "./strings";

export type PublicPagePath = "/" | "/how-it-works" | "/privacy";

/**
 * The build's variables, import.meta.env in the app or Vite's loadEnv in a script. These tags read
 * VITE_SITE_URL and VITE_PUBLIC_INDEXING_ENABLED.
 */
export type SiteEnv = Readonly<Record<string, unknown>>;

export const PRODUCTION_URL = "https://dsa-learning.bernardosevero.dev";
const OG_IMAGE_PATH = "/og-image.png";
const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const INDEXABLE = "index,follow";
const NOT_INDEXABLE = "noindex";

/** Each public page's title and description, in the order the sitemap lists them. */
export const PUBLIC_PAGES: Readonly<
  Record<PublicPagePath, { readonly title: string; readonly description: string }>
> = {
  "/": t.meta.publicPages.landing,
  "/how-it-works": t.meta.publicPages.howItWorks,
  "/privacy": t.meta.publicPages.privacy,
};

/** Returns the public paths, home first. */
export function listPublicPagePaths(): PublicPagePath[] {
  return Object.keys(PUBLIC_PAGES) as PublicPagePath[]; // safe: the keys are PublicPagePath by type
}

/**
 * Returns the canonical origin: VITE_SITE_URL when the build sets it, else production. Never a
 * preview's own host, so a preview never claims to be the canonical page.
 */
export function readSiteUrl(env: SiteEnv): string {
  const configured = env.VITE_SITE_URL;
  return typeof configured === "string" && configured !== "" ? configured : PRODUCTION_URL;
}

/** Returns whether public pages may be indexed: only when the flag is exactly "true". */
export function isPublicIndexingEnabled(env: SiteEnv): boolean {
  return env.VITE_PUBLIC_INDEXING_ENABLED === "true";
}

/** Returns a public page's absolute canonical URL: the origin plus its path, no query. */
export function buildCanonicalUrl(env: SiteEnv, path: PublicPagePath): string {
  return `${readSiteUrl(env)}${path}`;
}

function buildPreviewTags(
  env: SiteEnv,
  page: { readonly title: string; readonly description: string },
  pageUrl: string,
): MetaDescriptor[] {
  const imageUrl = `${readSiteUrl(env)}${OG_IMAGE_PATH}`;
  return [
    { name: "description", content: page.description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: t.appName },
    { property: "og:title", content: page.title },
    { property: "og:description", content: page.description },
    { property: "og:url", content: pageUrl },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: String(OG_IMAGE_WIDTH) },
    { property: "og:image:height", content: String(OG_IMAGE_HEIGHT) },
    { property: "og:image:alt", content: t.meta.imageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: page.title },
    { name: "twitter:description", content: page.description },
    { name: "twitter:image", content: imageUrl },
  ];
}

/**
 * Returns the head tags of a public page: its title, robots (indexable only when the build's flag
 * allows), description, canonical and link-preview tags.
 */
export function buildPublicPageMeta(env: SiteEnv, path: PublicPagePath): MetaDescriptor[] {
  const page = PUBLIC_PAGES[path];
  const canonicalUrl = buildCanonicalUrl(env, path);
  return [
    { title: page.title },
    { name: "robots", content: isPublicIndexingEnabled(env) ? INDEXABLE : NOT_INDEXABLE },
    { tagName: "link", rel: "canonical", href: canonicalUrl },
    ...buildPreviewTags(env, page, canonicalUrl),
  ];
}

/**
 * Returns the head tags of every other page (practice screens, the app shell, 404): never
 * indexable, with the product's own link preview. Those pages set their own <title>.
 */
export function buildPrivatePageMeta(env: SiteEnv): MetaDescriptor[] {
  const page = { title: t.meta.title, description: t.meta.description };
  return [
    { name: "robots", content: NOT_INDEXABLE },
    ...buildPreviewTags(env, page, `${readSiteUrl(env)}/`),
  ];
}

/** Returns the landing page's SoftwareApplication JSON-LD, stating only what the page shows. */
export function buildLandingJsonLd(env: SiteEnv): MetaDescriptor {
  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: t.appName,
      url: buildCanonicalUrl(env, "/"),
      description: t.meta.applicationDescription,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
    },
  };
}
