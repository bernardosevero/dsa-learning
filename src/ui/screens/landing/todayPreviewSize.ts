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
