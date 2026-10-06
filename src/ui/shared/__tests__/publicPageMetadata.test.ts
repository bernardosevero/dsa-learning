import type { MetaDescriptor } from "react-router";
import { describe, expect, it } from "vitest";

import {
  buildLandingJsonLd,
  buildPrivatePageMeta,
  buildPublicPageMeta,
  listPublicPagePaths,
  type PublicPagePath,
} from "../publicPageMetadata";

const PRODUCTION_URL = "https://dsa-learning.bernardosevero.dev";
const PREVIEW_URL = "https://feature-dsa-learning.bernardoseverosilveira.workers.dev";
const INDEXED = { VITE_PUBLIC_INDEXING_ENABLED: "true" };

type Fields = Readonly<Record<string, unknown>>;

// Every MetaDescriptor variant is a plain object of fields, so it reads as one.
function fieldsOf(descriptor: MetaDescriptor): Fields {
  return descriptor;
}

/** A tag's identity: its name, property or rel, or for the others (title, JSON-LD) its key. */
function identifyTag(fields: Fields): string {
  for (const key of ["name", "property", "rel"]) {
    const value = fields[key];
    if (typeof value === "string") {
      return value;
    }
  }
  return Object.keys(fields).join();
}

/** Open Graph tags use `property`, the others `name`. */
function readContent(tags: readonly MetaDescriptor[], key: string): unknown {
  const tag = tags.map(fieldsOf).find((fields) => fields.name === key || fields.property === key);
  return tag?.content;
}

function readTitle(tags: readonly MetaDescriptor[]): unknown {
  return tags.map(fieldsOf).find((fields) => "title" in fields)?.title;
}

function readCanonical(tags: readonly MetaDescriptor[]): unknown {
  return tags.map(fieldsOf).find((fields) => fields.rel === "canonical")?.href;
}

describe("buildPublicPageMeta", () => {
  it.each([
    ["/", "Spaced repetition for NeetCode 150 | dsa-learning"],
    ["/how-it-works", "How spaced-repetition practice works | dsa-learning"],
    ["/privacy", "Privacy and credits | dsa-learning"],
  ] as const)("titles %s as %s", (path, title) => {
    const tags = buildPublicPageMeta({}, path);

    expect(readTitle(tags)).toBe(title);
  });

  it("gives each public page its own title and description", () => {
    const pages = listPublicPagePaths().map((path) => buildPublicPageMeta({}, path));

    expect(new Set(pages.map(readTitle)).size).toBe(3);
    expect(new Set(pages.map((tags) => readContent(tags, "description"))).size).toBe(3);
  });

  it("builds the canonical, og:url and image from VITE_SITE_URL, never from a preview host", () => {
    const tags = buildPublicPageMeta({ VITE_SITE_URL: "" }, "/how-it-works");

    expect(readCanonical(tags)).toBe(`${PRODUCTION_URL}/how-it-works`);
    expect(readContent(tags, "og:url")).toBe(`${PRODUCTION_URL}/how-it-works`);
    expect(readContent(tags, "og:image")).toBe(`${PRODUCTION_URL}/og-image.png`);
    expect(JSON.stringify(tags)).not.toContain(PREVIEW_URL);
  });

  it("uses a configured VITE_SITE_URL for every absolute URL", () => {
    const tags = buildPublicPageMeta({ VITE_SITE_URL: "https://example.dev" }, "/privacy");

    expect(readCanonical(tags)).toBe("https://example.dev/privacy");
    expect(readContent(tags, "twitter:image")).toBe("https://example.dev/og-image.png");
  });

  it.each(["description", "og:title", "og:description", "og:image:alt", "twitter:title"])(
    "has a non-empty %s",
    (key) => {
      const tags = buildPublicPageMeta({}, "/");

      expect(String(readContent(tags, key)).trim()).not.toBe("");
    },
  );

  it("asks for a large image card on a website", () => {
    const tags = buildPublicPageMeta({}, "/");

    expect(readContent(tags, "og:type")).toBe("website");
    expect(readContent(tags, "twitter:card")).toBe("summary_large_image");
  });

  it("is indexable only when VITE_PUBLIC_INDEXING_ENABLED is exactly true", () => {
    const flags = [undefined, "", "false", "TRUE", "1", "true"];

    const robots = flags.map((flag) =>
      readContent(buildPublicPageMeta({ VITE_PUBLIC_INDEXING_ENABLED: flag }, "/"), "robots"),
    );

    expect(robots).toEqual(["noindex", "noindex", "noindex", "noindex", "noindex", "index,follow"]);
  });

  it("has exactly one tag of each kind, so the head never repeats one", () => {
    const tags = buildPublicPageMeta(INDEXED, "/");

    const keys = tags.map(fieldsOf).map(identifyTag);

    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("buildPrivatePageMeta", () => {
  it("keeps practice pages and 404 noindex even when public indexing is on", () => {
    const tags = buildPrivatePageMeta(INDEXED);

    expect(readContent(tags, "robots")).toBe("noindex");
    expect(readCanonical(tags)).toBeUndefined();
  });
});

describe("buildLandingJsonLd", () => {
  it("states only truthful SoftwareApplication fields, with no ratings or reviews", () => {
    const jsonLd = buildLandingJsonLd({});

    expect(fieldsOf(jsonLd)["script:ld+json"]).toEqual({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "dsa-learning",
      url: `${PRODUCTION_URL}/`,
      description: expect.stringContaining("NeetCode 150") as unknown,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
    });
  });
});

describe("listPublicPagePaths", () => {
  it("lists the three public pages, home first", () => {
    const paths: PublicPagePath[] = listPublicPagePaths();

    expect(paths).toEqual(["/", "/how-it-works", "/privacy"]);
  });
});
