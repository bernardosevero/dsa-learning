import { expect, test, type Page } from "@playwright/test";

import { logFirstProblem } from "./flows";

const STORAGE_KEY = "dsa-learning:v1";
const PRACTICE_PATHS = [
  "/",
  "/problems",
  "/problems/two-sum",
  "/settings",
  "/solve/two-sum",
  "/log/two-sum",
] as const;
const WINDOW_WIDTHS = [390, 700, 900, 1440] as const;

function usageSwitch(page: Page) {
  return page.getByRole("switch", { name: "Share usage data" });
}

async function readSave(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY);
}

// Collects uncaught errors and console errors, such as a hydration mismatch. A resource that
// fails to load (the web fonts, offline or behind a proxy) is the network's, not the page's.
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource")) {
      errors.push(message.text());
    }
  });
  return errors;
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("/privacy is meaningful HTML: the disclosure, its title and the language", async ({
    page,
  }) => {
    const response = await page.goto("/privacy");

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle("Privacy & credits · dsa-learning");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { level: 1, name: "Privacy & credits" })).toBeVisible();
    await expect(page.getByText(/Your notes, key insights/)).toBeVisible();
    await expect(usageSwitch(page)).toBeDisabled();
  });
});

test("the app shell and /privacy hydrate without errors", async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();
  await page.goto("/privacy");
  await expect(usageSwitch(page)).toBeEnabled();

  expect(errors).toEqual([]);
});

test("a public visit leaves the practice save as it was and mounts no practice app", async ({
  page,
}) => {
  await page.goto("/");
  await logFirstProblem(page, "Medium");
  await page.goto("/solve/two-sum");
  await expect(page.getByRole("heading", { level: 1, name: "Two Sum" })).toBeVisible();
  const saveBefore = await readSave(page);

  await page.goto("/privacy");
  await expect(usageSwitch(page)).toBeEnabled();

  expect(await readSave(page)).toBe(saveBefore);
  expect(saveBefore).toContain('"activeTimer"');
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open app" })).toBeVisible();
});

test("the public privacy switch and Settings agree, both ways", async ({ page }) => {
  await page.goto("/privacy");
  await usageSwitch(page).click();
  await expect(usageSwitch(page)).not.toBeChecked();

  await page.goto("/settings");
  await expect(usageSwitch(page)).not.toBeChecked();
  await usageSwitch(page).click();
  await page.goto("/privacy");

  await expect(usageSwitch(page)).toBeChecked();
});

test("every practice address loads directly, and progress survives a reload", async ({ page }) => {
  await page.goto("/");
  await logFirstProblem(page, "Medium");

  for (const path of PRACTICE_PATHS) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }), path).toBeVisible();
  }
  await page.goto("/problems/contains-duplicate");
  await page.reload();

  await expect(page.getByText("Medium").first()).toBeVisible();
});

test("an unknown address gets the 404 page with a 404 status", async ({ page }) => {
  const errors = collectErrors(page);

  const response = await page.goto("/does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("an unknown problem gets a 404 status, then the app says it isn't in the list", async ({
  page,
}) => {
  for (const path of ["/problems/not-a-problem", "/solve/not-a-problem", "/log/not-a-problem"]) {
    const response = await page.goto(path);

    expect(response?.status(), path).toBe(404);
    await expect(page.getByText(/isn't in the list|Page not found/).first(), path).toBeVisible();
  }
});

test("pages are noindex, and assets keep their types", async ({ page, request }) => {
  await page.goto("/privacy");
  const scriptUrl = await page.locator("link[rel=modulepreload]").first().getAttribute("href");
  const stylesheetUrl = await page.locator("link[rel=stylesheet][href^='/']").getAttribute("href");

  for (const path of ["/", "/settings", "/privacy", "/does-not-exist"]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toContain('<meta name="robots" content="noindex"/>');
  }
  const scriptResponse = await request.get(scriptUrl ?? "");
  const stylesheetResponse = await request.get(stylesheetUrl ?? "");
  expect(scriptResponse.headers()["content-type"]).toContain("javascript");
  expect(stylesheetResponse.headers()["content-type"]).toContain("text/css");
  expect((await request.get("/favicon.svg")).headers()["content-type"]).toContain("image/svg+xml");
});

test("the app shell's HTML holds no practice content", async ({ request }) => {
  const shell = await (await request.get("/settings")).text();

  expect(shell).not.toContain("Contains Duplicate");
  expect(shell).not.toContain(STORAGE_KEY);
});

for (const windowWidth of WINDOW_WIDTHS) {
  test(`/privacy fits a ${windowWidth}px window with its footer below the sheet`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: windowWidth, height: 900 });

    await page.goto("/privacy");
    await expect(page.getByRole("link", { name: "Open app" })).toBeInViewport();
    const footer = page.getByRole("contentinfo", { name: "About the creator" });
    await footer.scrollIntoViewIfNeeded();

    await expect(footer).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    expect(
      await page
        .locator("html")
        .evaluate((element: { readonly scrollWidth: number }) => element.scrollWidth),
    ).toBeLessThanOrEqual(windowWidth);
  });
}
