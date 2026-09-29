import { expect, test, type Page } from "@playwright/test";

const TODAY = new Date("2026-10-01T10:00:00");

// Every screen, in an order that works on a fresh browser: Solving starts the timer Log needs.
const SCREENS = [
  "/",
  "/problems",
  "/problems/two-sum",
  "/settings",
  "/privacy",
  "/solve/two-sum",
  "/log/two-sum",
] as const;

// One width in each band of the layout: phone, the 640px column, the 720px sheet, the wide sheet.
const WINDOW_WIDTHS = [390, 700, 900, 1440] as const;

// The sheet is the frame the header sits in, the same element on every screen.
async function measureSheet(page: Page, path: string): Promise<string> {
  await page.goto(path);
  const sheet = page.locator("header").locator("..");
  await expect(sheet).toBeVisible();
  const box = await sheet.boundingBox();
  if (box === null) {
    throw new Error(`${path} has no sheet on screen`);
  }
  return `left ${Math.round(box.x)}, width ${Math.round(box.width)}`;
}

for (const windowWidth of WINDOW_WIDTHS) {
  test(`every screen has the same sheet width and position at ${windowWidth}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: windowWidth, height: 900 });
    await page.clock.install({ time: TODAY });

    const sheetOf: Record<string, string> = {};
    for (const path of SCREENS) {
      sheetOf[path] = await measureSheet(page, path);
    }

    const todaySheet = sheetOf["/"];
    for (const path of SCREENS) {
      expect(sheetOf[path], `${path} at ${windowWidth}px`).toBe(todaySheet);
    }
  });
}
