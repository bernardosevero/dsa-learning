// Draws public/today-preview.webp, the landing page's picture of the Today screen, from synthetic
// practice data. Run it against a local build, e.g. `pnpm build && pnpm preview --port 4173`, then
// `pnpm tsx scripts/renderTodayPreview.ts --url http://localhost:4173/today`. It refuses any other host,
// so it never seeds data into a real site, and its browser context is fresh, so no user's save is
// read or written. The web fonts come from Google Fonts, so it needs network access.

import { Buffer } from "node:buffer";
import { writeFile } from "node:fs/promises";
import process from "node:process";
import { parseArgs } from "node:util";

import { chromium, type Page } from "@playwright/test";

import { DEFAULT_SETTINGS, type SaveFile } from "@/domain/types";
import { anAttempt, aSaveFile } from "@/test/builders";
import { TODAY_PREVIEW_SIZE } from "@/ui/screens/landing/todayPreviewSize";

const OUTPUT_URL = new URL("../public/today-preview.webp", import.meta.url);
// WebP is a fraction of the PNG's size at this quality, and the picture is the landing's LCP.
const WEBP_QUALITY = 0.9;
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);
// A fixed day and zone, so the due dates and the "days overdue" below never drift.
const FIXED_NOW = new Date("2026-10-10T10:00:00Z");
const TIME_ZONE = "UTC";
// The app's localStorage key (src/storage/localStore.ts, which needs the DOM types to import).
const STORAGE_KEY = "dsa-learning:v1";

// On 2026-10-10: Contains Duplicate is 5 days overdue (Hard, the focus), Two Sum 1 (Hard), Valid
// Anagram 3 (Medium); Group Anagrams is scheduled, so Top K Frequent Elements is the next new one.
// No notes or insights: the picture never shows anyone's own words.
const PREVIEW_SAVE: SaveFile = aSaveFile({
  entries: [
    anAttempt({
      id: "preview-1",
      problemId: "valid-anagram",
      rating: "medium",
      date: "2026-09-30",
    }),
    anAttempt({ id: "preview-2", problemId: "group-anagrams", rating: "easy", date: "2026-10-02" }),
    anAttempt({
      id: "preview-3",
      problemId: "contains-duplicate",
      rating: "hard",
      date: "2026-10-03",
    }),
    anAttempt({ id: "preview-4", problemId: "two-sum", rating: "hard", date: "2026-10-07" }),
  ],
  settings: { ...DEFAULT_SETTINGS, shareAnonymousUsage: false },
});

// Runs in the page, as a string because this project's Node types have no DOM.
const FONTS_READY_SCRIPT = `document.fonts.ready.then(() =>
  [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family),
)`;
const REQUIRED_FONT_FAMILIES = ["Newsreader", "IBM Plex Sans", "IBM Plex Mono"] as const;

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Returns the --url argument when it points at this machine. */
function readLocalUrl(): Result<URL> {
  const { values } = parseArgs({ options: { url: { type: "string" } } });
  if (values.url === undefined) {
    return { ok: false, error: "Pass the local Today address: --url http://localhost:4173/today" };
  }
  if (!URL.canParse(values.url)) {
    return { ok: false, error: `${values.url} is not a URL` };
  }
  const url = new URL(values.url);
  if (!LOCAL_HOSTNAMES.has(url.hostname)) {
    return { ok: false, error: `${url.hostname} is not local; use a localhost address` };
  }
  return { ok: true, value: url };
}

/** Re-encodes a PNG as WebP with Chromium's own encoder, so the script needs no image library. */
async function encodeWebp(page: Page, png: Buffer): Promise<Buffer> {
  // A string, because it runs in the page.
  const webpBase64 = await page.evaluate<string>(`(async () => {
    const image = new Image();
    image.src = "data:image/png;base64,${png.toString("base64")}";
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext("2d").drawImage(image, 0, 0);
    return canvas.toDataURL("image/webp", ${WEBP_QUALITY}).split(",")[1];
  })()`);
  return Buffer.from(webpBase64, "base64");
}

function hasEveryFontFamily(loadedFamilies: readonly string[]): boolean {
  const unquotedFamilies = new Set(loadedFamilies.map((family) => family.replaceAll('"', "")));
  return REQUIRED_FONT_FAMILIES.every((family) => unquotedFamilies.has(family));
}

async function renderTodayPreview(todayUrl: URL): Promise<Result<number>> {
  // For machines with a preinstalled Chromium that doesn't match this Playwright version.
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const browser = await chromium.launch(executablePath === undefined ? {} : { executablePath });
  try {
    const context = await browser.newContext({
      viewport: { width: TODAY_PREVIEW_SIZE.cssWidth, height: TODAY_PREVIEW_SIZE.cssHeight },
      deviceScaleFactor: TODAY_PREVIEW_SIZE.scale,
      timezoneId: TIME_ZONE,
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    await context.clock.setFixedTime(FIXED_NOW);
    // A string, like the fonts script, because it runs in the page.
    await context.addInitScript({
      content: `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(JSON.stringify(PREVIEW_SAVE))});`,
    });
    const page = await context.newPage();
    await page.goto(todayUrl.href);
    await page.getByRole("heading", { level: 1, name: "Today" }).waitFor();
    await page.getByRole("link", { name: "Start Top K Frequent Elements" }).waitFor();
    // The page scrolls past the picture's bottom edge; its scrollbar would show as a stripe.
    await page.addStyleTag({ content: "html { scrollbar-width: none; }" });
    const loadedFamilies = await page.evaluate<string[]>(FONTS_READY_SCRIPT);
    if (!hasEveryFontFamily(loadedFamilies)) {
      return { ok: false, error: `Chromium loaded only these fonts: ${loadedFamilies.join(", ")}` };
    }

    const screenshot = await page.screenshot({ type: "png" });
    const preview = await encodeWebp(page, screenshot);
    await writeFile(OUTPUT_URL, preview);
    return { ok: true, value: preview.byteLength };
  } finally {
    await browser.close();
  }
}

const todayUrl = readLocalUrl();
const render = todayUrl.ok ? await renderTodayPreview(todayUrl.value) : todayUrl;
if (render.ok) {
  process.stdout.write(`Wrote public/today-preview.webp (${render.value} bytes)\n`);
} else {
  console.error(`renderTodayPreview failed: ${render.error}`);
  process.exitCode = 1;
}
