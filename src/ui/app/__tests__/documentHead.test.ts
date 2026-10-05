import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import appleTouchIconDataUrl from "../../../../public/apple-touch-icon.png?inline";
import faviconSvg from "../../../../public/favicon.svg?raw";
import ogImageDataUrl from "../../../../public/og-image.png?inline";
import themeCss from "../../../index.css?raw";
import { DocumentHead } from "../DocumentHead";

const SITE_URL = "https://dsa-learning.example.dev";
const PRODUCTION_URL = "https://dsa-learning.bernardosevero.dev";
// Unfurlers read the head as the build writes it into every page's HTML.
const documentHeadHtml = renderToStaticMarkup(createElement(DocumentHead));

const OG_IMAGE_WIDTH = 1200;
const OG_IMAGE_HEIGHT = 630;
const MAX_OG_IMAGE_BYTES = 300_000;
const APPLE_TOUCH_ICON_SIDE = 180;

const HEAD_TAG_PATTERN = /<(?:meta|link)\s[^>]*>/g;
const ATTRIBUTE_PATTERN = /([\w:-]+)="([^"]*)"/g;
// The width and height sit in the IHDR chunk, right after the 8-byte PNG signature.
const PNG_WIDTH_OFFSET = 16;
const PNG_HEIGHT_OFFSET = 20;

type HeadTag = ReadonlyMap<string, string>;

function parseHeadTags(html: string): HeadTag[] {
  const tags: HeadTag[] = [];
  for (const [tag] of html.matchAll(HEAD_TAG_PATTERN)) {
    const attributes = new Map<string, string>();
    for (const [, name, value] of tag.matchAll(ATTRIBUTE_PATTERN)) {
      attributes.set(name ?? "", value ?? "");
    }
    tags.push(attributes);
  }
  return tags;
}

const headTags = parseHeadTags(documentHeadHtml);

/** Open Graph tags use `property`, the others `name`. */
function readMetaContent(key: string, tags: readonly HeadTag[] = headTags): string | undefined {
  const tag = tags.find(
    (headTag) => headTag.get("name") === key || headTag.get("property") === key,
  );
  return tag?.get("content");
}

function findLink(rel: string): HeadTag | undefined {
  return headTags.find((tag) => tag.get("rel") === rel);
}

function decodeDataUrl(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function readPngSize(png: Uint8Array): { width: number; height: number } {
  const view = new DataView(png.buffer);
  return { width: view.getUint32(PNG_WIDTH_OFFSET), height: view.getUint32(PNG_HEIGHT_OFFSET) };
}

function readBackgroundToken(selector: string): string | undefined {
  const block = themeCss.slice(themeCss.indexOf(`${selector} {`));
  return /--background:\s*(#[\da-f]{6});/i.exec(block)?.[1];
}

async function renderHeadWithSiteUrl(siteUrl: string): Promise<HeadTag[]> {
  vi.stubEnv("VITE_SITE_URL", siteUrl);
  vi.resetModules();
  const headModule = await import("../DocumentHead");
  return parseHeadTags(renderToStaticMarkup(createElement(headModule.DocumentHead)));
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DocumentHead link preview tags", () => {
  it.each([
    "description",
    "og:type",
    "og:site_name",
    "og:title",
    "og:description",
    "og:url",
    "og:image",
    "og:image:width",
    "og:image:height",
    "og:image:alt",
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
  ])("has a non-empty %s", (key) => {
    const content = readMetaContent(key);

    expect(content?.trim()).toBeTruthy();
  });

  it("builds the page and image URLs as absolute URLs from VITE_SITE_URL", async () => {
    const tags = await renderHeadWithSiteUrl(SITE_URL);

    const urls = ["og:url", "og:image", "twitter:image"].map((key) => readMetaContent(key, tags));

    expect(urls).toEqual([`${SITE_URL}/`, `${SITE_URL}/og-image.png`, `${SITE_URL}/og-image.png`]);
  });

  it("falls back to the production address when VITE_SITE_URL is not set", async () => {
    const tags = await renderHeadWithSiteUrl("");

    const pageUrl = readMetaContent("og:url", tags);

    expect(pageUrl).toBe(`${PRODUCTION_URL}/`);
  });

  it("asks for a large image card on a website", () => {
    const ogType = readMetaContent("og:type");
    const twitterCard = readMetaContent("twitter:card");

    expect(ogType).toBe("website");
    expect(twitterCard).toBe("summary_large_image");
  });

  it("keeps the app out of search results", () => {
    const robots = readMetaContent("robots");

    expect(robots).toBe("noindex");
  });

  it("links an SVG favicon and an Apple touch icon", () => {
    const favicon = findLink("icon");
    const appleTouchIcon = findLink("apple-touch-icon");

    expect(favicon?.get("href")).toBe("/favicon.svg");
    expect(favicon?.get("type")).toBe("image/svg+xml");
    expect(faviconSvg).toContain("<svg");
    expect(appleTouchIcon?.get("href")).toBe("/apple-touch-icon.png");
  });

  it("serves a 180×180 Apple touch icon, the size iOS asks for", () => {
    const appleTouchIcon = decodeDataUrl(appleTouchIconDataUrl);

    const size = readPngSize(appleTouchIcon);

    expect(size).toEqual({ width: APPLE_TOUCH_ICON_SIDE, height: APPLE_TOUCH_ICON_SIDE });
  });

  it("sets the theme color of each color scheme to its --background token", () => {
    const themeColors = headTags
      .filter((tag) => tag.get("name") === "theme-color")
      .map((tag) => [tag.get("media"), tag.get("content")]);

    expect(themeColors).toEqual([
      ["(prefers-color-scheme: light)", readBackgroundToken(":root")],
      ["(prefers-color-scheme: dark)", readBackgroundToken(".dark")],
    ]);
  });
});

describe("public/og-image.png", () => {
  it("is 1200×630, as its og:image size tags say, and under 300 kB", () => {
    const ogImage = decodeDataUrl(ogImageDataUrl);

    const size = readPngSize(ogImage);

    expect(size).toEqual({ width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT });
    expect(readMetaContent("og:image:width")).toBe(String(OG_IMAGE_WIDTH));
    expect(readMetaContent("og:image:height")).toBe(String(OG_IMAGE_HEIGHT));
    expect(ogImage.byteLength).toBeLessThan(MAX_OG_IMAGE_BYTES);
  });
});
