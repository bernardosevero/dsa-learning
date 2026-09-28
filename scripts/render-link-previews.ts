// Draws the link-preview assets into public/: favicon.svg, apple-touch-icon.png and og-image.png
// (the Open Graph image unfurlers show). Run with `pnpm tsx scripts/render-link-previews.ts`
// after changing the design below. It needs network access to download the Google Fonts, which it
// inlines so the page Chromium draws makes no requests of its own.

import { Buffer } from "node:buffer";
import { writeFile } from "node:fs/promises";
import process from "node:process";

import { chromium } from "@playwright/test";

const PUBLIC_DIRECTORY_URL = new URL("../public/", import.meta.url);

// The light theme tokens in src/index.css.
const COLORS = {
  background: "#f6f4ee",
  foreground: "#1d1c19",
  primary: "#2d5b4b",
  primaryForeground: "#f8f6f0",
  ratingHard: "#ae4128",
  ratingHardMuted: "#f5e2db",
  ratingMedium: "#855a0f",
  ratingMediumMuted: "#f3e8d1",
  ratingEasy: "#2a6190",
  ratingEasyMuted: "#dde8f2",
} as const;

const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;
const APPLE_TOUCH_ICON_SIDE = 180;
// Unfurlers reject large images, and the issue caps it well under their limits.
const MAX_OG_IMAGE_BYTES = 300_000;

// The lucide rotate-ccw arrow: "re-solve it later", in a 24×24 box.
const ARROW_PATHS = `<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />`;

function drawIconSvg(cornerRadius: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="${cornerRadius}" fill="${COLORS.primary}" />
  <g transform="translate(6 6) scale(0.8333)" fill="none" stroke="${COLORS.primaryForeground}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${ARROW_PATHS}</g>
</svg>
`;
}

const FONTS_STYLESHEET_URL =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@500&family=Newsreader:opsz,wght@6..72,500;6..72,600&display=block";
const FONT_FAMILIES = ["Newsreader", "IBM Plex Sans"] as const;
const FONT_FILE_URL_PATTERN = /url\((https:[^)]+)\)/g;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Returns the Google Fonts stylesheet with every font file inlined as a data: URL. */
async function downloadInlinedFontsCss(): Promise<Result<string>> {
  const stylesheet = await fetch(FONTS_STYLESHEET_URL);
  if (!stylesheet.ok) {
    return {
      ok: false,
      error: `GET ${FONTS_STYLESHEET_URL} failed with HTTP ${stylesheet.status}`,
    };
  }
  const originalCss = await stylesheet.text();
  let css = originalCss;
  for (const [urlCall, fontFileUrl = ""] of originalCss.matchAll(FONT_FILE_URL_PATTERN)) {
    const fontFile = await fetch(fontFileUrl);
    if (!fontFile.ok) {
      return { ok: false, error: `GET ${fontFileUrl} failed with HTTP ${fontFile.status}` };
    }
    const base64 = Buffer.from(await fontFile.arrayBuffer()).toString("base64");
    css = css.replace(urlCall, `url(data:font/ttf;base64,${base64})`);
  }
  return { ok: true, value: css };
}

function drawRatingChip(label: string, color: string, background: string): string {
  return `<span class="chip" style="color: ${color}; background: ${background}"><span class="dot" style="background: ${color}"></span>${label}</span>`;
}

// Everything that must read sits in the centre 630px, so square crops (WhatsApp, iMessage) keep it.
function drawOgImageHtml(fontsCss: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>${fontsCss}</style>
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    width: ${OG_IMAGE_SIZE.width}px;
    height: ${OG_IMAGE_SIZE.height}px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 36px;
    background: ${COLORS.background};
    color: ${COLORS.foreground};
    font-family: "IBM Plex Sans", sans-serif;
    text-align: center;
  }
  .wordmark {
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: "Newsreader", serif;
    font-size: 34px;
    font-weight: 600;
  }
  .wordmark svg { width: 40px; height: 40px; }
  h1 {
    width: 580px;
    font-family: "Newsreader", serif;
    font-size: 56px;
    font-weight: 500;
    line-height: 1.1;
    text-wrap: balance;
    letter-spacing: -0.01em;
  }
  h1 em { font-style: normal; color: ${COLORS.primary}; }
  .chips { display: flex; gap: 12px; }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 7px 16px;
    border-radius: 999px;
    font-size: 20px;
    font-weight: 500;
  }
  .dot { width: 10px; height: 10px; border-radius: 50%; }
</style>
</head>
<body>
  <div class="wordmark">${drawIconSvg(8)}dsa-learning</div>
  <h1>Re-solve problems right before you <em>forget</em> them.</h1>
  <div class="chips">
    ${drawRatingChip("Hard · 2 days", COLORS.ratingHard, COLORS.ratingHardMuted)}
    ${drawRatingChip("Medium · 7 days", COLORS.ratingMedium, COLORS.ratingMediumMuted)}
    ${drawRatingChip("Easy · 30 days", COLORS.ratingEasy, COLORS.ratingEasyMuted)}
  </div>
</body>
</html>`;
}

// iOS rounds the corners itself and shows transparency as black, so this one is square.
const APPLE_TOUCH_ICON_HTML = `<!doctype html>
<style>
  * { margin: 0; }
  svg { display: block; width: ${APPLE_TOUCH_ICON_SIDE}px; height: ${APPLE_TOUCH_ICON_SIDE}px; }
</style>
${drawIconSvg(0)}`;

// Runs in the page, as a string because this project's Node types have no DOM. Without the fonts
// Chromium would silently draw the image in its fallback fonts.
const LOADED_FONT_FAMILIES_SCRIPT = `document.fonts.ready.then(() =>
  [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family),
)`;

function hasEveryFontFamily(loadedFamilies: readonly string[]): boolean {
  const unquotedFamilies = new Set(loadedFamilies.map((family) => family.replaceAll('"', "")));
  return FONT_FAMILIES.every((family) => unquotedFamilies.has(family));
}

async function renderLinkPreviews(): Promise<Result<number>> {
  const fontsCss = await downloadInlinedFontsCss();
  if (!fontsCss.ok) {
    return fontsCss;
  }
  // For machines with a preinstalled Chromium that doesn't match this Playwright version.
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath });
  try {
    const page = await browser.newPage({ viewport: OG_IMAGE_SIZE });
    await page.setContent(drawOgImageHtml(fontsCss.value));
    const loadedFamilies = await page.evaluate<string[]>(LOADED_FONT_FAMILIES_SCRIPT);
    if (!hasEveryFontFamily(loadedFamilies)) {
      return { ok: false, error: `Chromium loaded only these fonts: ${loadedFamilies.join(", ")}` };
    }
    const ogImage = await page.screenshot({ type: "png" });
    if (ogImage.byteLength > MAX_OG_IMAGE_BYTES) {
      return { ok: false, error: `og-image.png is ${ogImage.byteLength} bytes, over the cap` };
    }

    await page.setViewportSize({ width: APPLE_TOUCH_ICON_SIDE, height: APPLE_TOUCH_ICON_SIDE });
    await page.setContent(APPLE_TOUCH_ICON_HTML);
    const appleTouchIcon = await page.screenshot({ type: "png" });

    await writeFile(new URL("og-image.png", PUBLIC_DIRECTORY_URL), ogImage);
    await writeFile(new URL("apple-touch-icon.png", PUBLIC_DIRECTORY_URL), appleTouchIcon);
    await writeFile(new URL("favicon.svg", PUBLIC_DIRECTORY_URL), drawIconSvg(8));
    return { ok: true, value: ogImage.byteLength };
  } finally {
    await browser.close();
  }
}

const render = await renderLinkPreviews();
if (render.ok) {
  process.stdout.write(
    `Wrote favicon.svg, apple-touch-icon.png and og-image.png (${render.value} bytes) to public/\n`,
  );
} else {
  console.error(`render-link-previews failed: ${render.error}`);
  process.exitCode = 1;
}
