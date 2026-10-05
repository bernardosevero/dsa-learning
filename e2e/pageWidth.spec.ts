import { expect, test, type Page } from "@playwright/test";

const TODAY = new Date("2026-10-01T10:00:00");

// Every practice screen, in an order that works on a fresh browser: Solving starts the timer Log
// needs. Public pages have their own layout; e2e/publicPages.spec.ts checks it.
const SCREENS = [
  "/",
  "/problems",
  "/problems/two-sum",
  "/settings",
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
      const footer = page.getByRole("contentinfo", { name: "About the creator" });
      const githubLink = footer.getByRole("link", { name: /GitHub/ });
      await githubLink.scrollIntoViewIfNeeded();
      await expect(footer).toBeVisible();
      await expect(githubLink).toBeInViewport();
      await expect(footer.getByRole("link", { name: /LinkedIn/ })).toBeInViewport();
      const sheet = page.locator("header").locator("..");
      await expect(sheet.locator("footer")).toHaveCount(0);
      const sheetBox = await sheet.boundingBox();
      const footerBox = await footer.boundingBox();
      expect(sheetBox).not.toBeNull();
      expect(footerBox).not.toBeNull();
      expect(footerBox?.y ?? 0).toBeGreaterThanOrEqual(
        (sheetBox?.y ?? 0) + (sheetBox?.height ?? 0),
      );
      expect(
        await page
          .locator("html")
          .evaluate((element: { readonly scrollWidth: number }) => element.scrollWidth),
      ).toBeLessThanOrEqual(windowWidth);
      if (windowWidth === 390 && !path.startsWith("/solve/") && !path.startsWith("/log/")) {
        const linkBox = await githubLink.boundingBox();
        const navBox = await page.getByRole("navigation", { name: "Main" }).boundingBox();
        expect(linkBox).not.toBeNull();
        expect(navBox).not.toBeNull();
        expect((linkBox?.y ?? 0) + (linkBox?.height ?? 0)).toBeLessThanOrEqual(navBox?.y ?? 0);
      }
      await page.screenshot({
        path: `test-results/footer-${windowWidth}-${path.replaceAll("/", "-") || "today"}.png`,
      });
    }

    const todaySheet = sheetOf["/"];
    for (const path of SCREENS) {
      expect(sheetOf[path], `${path} at ${windowWidth}px`).toBe(todaySheet);
    }
  });
}

test("the Settings footer privacy link is reachable above the phone navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto("/settings");

  await page
    .getByRole("region", { name: "Privacy & credits" })
    .getByRole("link", { name: "Privacy & credits" })
    .click();

  await expect(page).toHaveURL(/\/privacy$/);
});
