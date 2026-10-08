const CSS_WIDTH = 480;
const CSS_HEIGHT = 744;
// Twice the CSS pixels, so the picture stays sharp on high-density screens.
const SCALE = 2;

/**
 * The window scripts/renderTodayPreview.ts draws Today in, and the PNG's intrinsic size, so the
 * landing page reserves the picture's exact space before it loads.
 */
export const TODAY_PREVIEW_SIZE = {
  cssWidth: CSS_WIDTH,
  cssHeight: CSS_HEIGHT,
  scale: SCALE,
  width: CSS_WIDTH * SCALE,
  height: CSS_HEIGHT * SCALE,
} as const;

/**
 * Every copy of the picture the script writes, narrowest first. The picture is the landing's LCP,
 * so a phone downloads the copy its layout needs rather than the full size.
 */
export const TODAY_PREVIEW_FILES = [
  { path: "/today-preview-480w.webp", width: 480 },
  { path: "/today-preview-720w.webp", width: 720 },
  { path: "/today-preview.webp", width: TODAY_PREVIEW_SIZE.width },
] as const;
