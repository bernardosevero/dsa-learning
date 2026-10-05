import { expect, test, type Page } from "@playwright/test";

import { FIRST_PROBLEM, logFirstProblem } from "./flows";

const STORAGE_KEY = "dsa-learning:v1";
const CANONICAL_ORIGIN = "https://dsa-learning.bernardosevero.dev";
const PUBLIC_PAGES = [
  {
    path: "/",
    heading: "Spaced repetition for the NeetCode 150",
    title: "Spaced repetition for NeetCode 150 | dsa-learning",
  },
  {
    path: "/how-it-works",
    heading: "How spaced-repetition practice works",
    title: "How spaced-repetition practice works | dsa-learning",
  },
  {
    path: "/privacy",
    heading: "Privacy & credits",
    title: "Privacy and credits | dsa-learning",
  },
] as const;
const PRACTICE_PATHS = [
  "/today",
  "/problems",
  "/problems/two-sum",
  "/settings",
  "/solve/two-sum",
  "/log/two-sum",
] as const;
const WINDOW_WIDTHS = [390, 700, 900, 1440] as const;

// Today is Oct 10: the seeded Hard attempt on Contains Duplicate (Oct 1) is due.
const SEEDED_NOW = new Date("2026-10-10T10:00:00");
const SEEDED_SAVE = {
  version: 1,
  entries: [
    {
      type: "attempt",
      id: "seeded-attempt",
      problemId: "contains-duplicate",
      completedAt: "2026-10-01T12:00:00.000Z",
      date: "2026-10-01",
      rating: "hard",
      timeMinutes: 30,
      help: "none",
    },
  ],
  settings: {
    timeBoxMinutes: { Easy: 20, Medium: 30, Hard: 45 },
    showPatternOnReviews: false,
    shareAnonymousUsage: false,
  },
  activeTimer: { problemId: "contains-duplicate", startedAt: "2026-10-10T09:50:00.000Z" },
};

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

/** Every head tag that should appear once, with how many times it does. */
async function countHeadTags(page: Page): Promise<Record<string, number>> {
  const selectors = {
    title: "title",
    robots: "meta[name=robots]",
    description: "meta[name=description]",
    canonical: "link[rel=canonical]",
    ogTitle: "meta[property='og:title']",
    ogUrl: "meta[property='og:url']",
    twitterCard: "meta[name='twitter:card']",
    jsonLd: "script[type='application/ld+json']",
  };
  const counts: Record<string, number> = {};
  for (const [name, selector] of Object.entries(selectors)) {
    counts[name] = await page.locator(`head ${selector}`).count();
  }
  return counts;
}

function readHeadAttribute(page: Page, selector: string, attribute: string) {
  return page.locator(`head ${selector}`).getAttribute(attribute);
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const publicPage of PUBLIC_PAGES) {
    test(`${publicPage.path} is meaningful HTML with its own head tags`, async ({ page }) => {
      const response = await page.goto(publicPage.path);

      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("heading", { level: 1, name: publicPage.heading })).toBeVisible();
      await expect(page).toHaveTitle(publicPage.title);
      const canonicalUrl = `${CANONICAL_ORIGIN}${publicPage.path}`;
      expect(await readHeadAttribute(page, "link[rel=canonical]", "href")).toBe(canonicalUrl);
      expect(await readHeadAttribute(page, "meta[property='og:url']", "content")).toBe(
        canonicalUrl,
      );
      expect(await readHeadAttribute(page, "meta[property='og:title']", "content")).toBe(
        publicPage.title,
      );
      expect(await readHeadAttribute(page, "meta[name='twitter:card']", "content")).toBe(
        "summary_large_image",
      );
      expect(await readHeadAttribute(page, "meta[name=description]", "content")).toBeTruthy();
      // The test build leaves VITE_PUBLIC_INDEXING_ENABLED unset, so nothing is indexable.
      expect(await readHeadAttribute(page, "meta[name=robots]", "content")).toBe("noindex");
    });
  }

  test("the three public pages have unique titles and descriptions", async ({ page }) => {
    const titles = new Set<string>();
    const descriptions = new Set<string | null>();

    for (const publicPage of PUBLIC_PAGES) {
      await page.goto(publicPage.path);
      titles.add(await page.title());
      descriptions.add(await readHeadAttribute(page, "meta[name=description]", "content"));
    }

    expect(titles.size).toBe(PUBLIC_PAGES.length);
    expect(descriptions.size).toBe(PUBLIC_PAGES.length);
  });

  test("the landing's JSON-LD parses and states only truthful fields", async ({ page }) => {
    await page.goto("/");

    const jsonLd: unknown = JSON.parse(
      (await page.locator("script[type='application/ld+json']").textContent()) ?? "",
    );

    expect(jsonLd).toMatchObject({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "dsa-learning",
      url: `${CANONICAL_ORIGIN}/`,
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      isAccessibleForFree: true,
    });
    expect(jsonLd).not.toHaveProperty("aggregateRating");
    expect(jsonLd).not.toHaveProperty("review");
  });

  test("/privacy keeps its disclosure, with the switch waiting for JavaScript", async ({
    page,
  }) => {
    await page.goto("/privacy");

    await expect(page.getByText(/Your notes, key insights/)).toBeVisible();
    await expect(usageSwitch(page)).toBeDisabled();
  });
});

test("the public pages and the app shell hydrate without errors", async ({ page }) => {
  const errors = collectErrors(page);

  for (const publicPage of PUBLIC_PAGES) {
    await page.goto(publicPage.path);
    await expect(page.getByRole("heading", { level: 1, name: publicPage.heading })).toBeVisible();
  }
  await page.goto("/today");
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();
  await page.goto("/privacy");
  await expect(usageSwitch(page)).toBeEnabled();

  expect(errors).toEqual([]);
});

test("public → Start practicing → Solve → Log → Today keeps the saved entries, timer and choice", async ({
  page,
}) => {
  await page.clock.install({ time: SEEDED_NOW });
  await page.goto("/");
  await page.evaluate(([key, save]) => localStorage.setItem(key, save), [
    STORAGE_KEY,
    JSON.stringify(SEEDED_SAVE),
  ] as const);

  await page.getByRole("link", { name: "Start practicing" }).first().click();
  await expect(page).toHaveURL("/today");
  const dueReviews = page.getByRole("region", { name: /^Due reviews/ });
  await expect(dueReviews.getByRole("link", { name: `Start ${FIRST_PROBLEM}` })).toBeVisible();
  const saveOnToday = await readSave(page);
  expect(saveOnToday).toContain("seeded-attempt");
  expect(saveOnToday).toContain('"activeTimer"');
  expect(saveOnToday).toContain('"shareAnonymousUsage":false');

  await logFirstProblem(page, "Medium");
  await page.getByRole("link", { name: "Back to Today" }).click();

  await expect(page).toHaveURL("/today");
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();
  const saveAfter = await readSave(page);
  expect(saveAfter).toContain("seeded-attempt");
  expect(saveAfter).toContain('"shareAnonymousUsage":false');
});

test("a public visit leaves the practice save as it was and mounts no practice app", async ({
  page,
}) => {
  await page.goto("/today");
  await logFirstProblem(page, "Medium");
  await page.goto("/solve/two-sum");
  await expect(page.getByRole("heading", { level: 1, name: "Two Sum" })).toBeVisible();
  const saveBefore = await readSave(page);

  for (const publicPage of PUBLIC_PAGES) {
    await page.goto(publicPage.path);
    await expect(page.getByRole("heading", { level: 1, name: publicPage.heading })).toBeVisible();
  }

  expect(await readSave(page)).toBe(saveBefore);
  expect(saveBefore).toContain('"activeTimer"');
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open app" })).toBeVisible();
});

test("the public header leads home, to How it works and into the app", async ({ page }) => {
  await page.goto("/privacy");
  const site = page.getByRole("navigation", { name: "Site" });

  await site.getByRole("link", { name: "How it works" }).click();
  await expect(page).toHaveURL("/how-it-works");
  await page.getByRole("link", { name: "dsa-learning" }).click();
  await expect(page).toHaveURL("/");
  await page.getByRole("link", { name: "Open app" }).click();

  await expect(page).toHaveURL("/today");
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible();
});

test("client navigation swaps the head tags without duplicates or stale ones", async ({ page }) => {
  await page.goto("/");
  expect(await countHeadTags(page)).toMatchObject({ title: 1, canonical: 1, jsonLd: 1 });

  await page
    .getByRole("navigation", { name: "Site" })
    .getByRole("link", { name: "How it works" })
    .click();
  await expect(page).toHaveTitle("How spaced-repetition practice works | dsa-learning");
  expect(await countHeadTags(page)).toEqual({
    title: 1,
    robots: 1,
    description: 1,
    canonical: 1,
    ogTitle: 1,
    ogUrl: 1,
    twitterCard: 1,
    jsonLd: 0,
  });
  expect(await readHeadAttribute(page, "link[rel=canonical]", "href")).toBe(
    `${CANONICAL_ORIGIN}/how-it-works`,
  );

  await page.getByRole("link", { name: "Start practicing" }).click();
  await expect(page).toHaveTitle("Today · dsa-learning");
  expect(await countHeadTags(page)).toMatchObject({ title: 1, robots: 1, canonical: 0, jsonLd: 0 });
  expect(await readHeadAttribute(page, "meta[name=robots]", "content")).toBe("noindex");
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

test("every route class loads directly, and progress survives a reload", async ({ page }) => {
  await page.goto("/today");
  await logFirstProblem(page, "Medium");

  for (const path of [...PUBLIC_PAGES.map((publicPage) => publicPage.path), ...PRACTICE_PATHS]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1 }), path).toBeVisible();
  }
  await page.goto("/problems/contains-duplicate");
  await page.reload();

  await expect(page.getByText("Medium").first()).toBeVisible();
});

test("trailing slashes drop to the canonical address, keeping the query", async ({ page }) => {
  await page.goto("/how-it-works/");
  await expect(page).toHaveURL("/how-it-works");

  await page.goto("/today/?code=abc");

  await expect(page).toHaveURL("/today?code=abc");
});

test("the canonical omits the query string", async ({ page }) => {
  await page.goto("/how-it-works?ref=newsletter");

  expect(await readHeadAttribute(page, "link[rel=canonical]", "href")).toBe(
    `${CANONICAL_ORIGIN}/how-it-works`,
  );
});

test("an unknown address gets the 404 page with a 404 status", async ({ page }) => {
  const errors = collectErrors(page);

  for (const path of ["/does-not-exist", "/how-it-work", "/privacy/extra"]) {
    const response = await page.goto(path);

    expect(response?.status(), path).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("an unknown problem gets the static 404 page with a 404 status and no scripts", async ({
  page,
}) => {
  const errors = collectErrors(page);

  for (const path of ["/problems/not-a-problem", "/solve/not-a-problem", "/log/not-a-problem"]) {
    const response = await page.goto(path);

    expect(response?.status(), path).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
    await expect(page.locator("script")).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("/404 answers with a real 404 status", async ({ page }) => {
  const response = await page.goto("/404");

  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
});

test("practice pages, the app shell and 404 are always noindex", async ({ request }) => {
  for (const path of ["/today", "/settings", "/__spa-fallback", "/does-not-exist"]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toContain('<meta name="robots" content="noindex"/>');
    expect(html, path).not.toContain('rel="canonical"');
  }
  const appShell = await request.get("/__spa-fallback");
  expect(appShell.headers()["x-robots-tag"]).toBe("noindex");
});

test("assets, robots.txt and the sitemap keep their own responses", async ({ page, request }) => {
  await page.goto("/privacy");
  const scriptUrl = await page.locator("link[rel=modulepreload]").first().getAttribute("href");
  const stylesheetUrl = await page.locator("link[rel=stylesheet][href^='/']").getAttribute("href");

  const expectedTypes = [
    [scriptUrl ?? "", "javascript"],
    [stylesheetUrl ?? "", "text/css"],
    ["/favicon.svg", "image/svg+xml"],
    ["/today-preview.png", "image/png"],
    ["/og-image.png", "image/png"],
    ["/robots.txt", "text/plain"],
    ["/sitemap.xml", "xml"],
  ] as const;
  for (const [path, contentType] of expectedTypes) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toContain(contentType);
  }
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("User-agent: *\nAllow: /");
  expect(robots).toContain(`Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`);
  // Indexing is off in the test build, so the sitemap lists nothing.
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("<url>");
});

test("the app shell's HTML holds no practice content", async ({ request }) => {
  const shell = await (await request.get("/settings")).text();

  expect(shell).not.toContain("Contains Duplicate");
  expect(shell).not.toContain(STORAGE_KEY);
});

for (const windowWidth of WINDOW_WIDTHS) {
  test(`public pages fit a ${windowWidth}px window with the footer below the sheet`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: windowWidth, height: 900 });

    for (const publicPage of PUBLIC_PAGES) {
      await page.goto(publicPage.path);
      await expect(page.getByRole("link", { name: "Open app" })).toBeInViewport();
      const footer = page.getByRole("contentinfo", { name: "About the creator" });
      await footer.scrollIntoViewIfNeeded();

      await expect(footer, publicPage.path).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
      expect(
        await page
          .locator("html")
          .evaluate((element: { readonly scrollWidth: number }) => element.scrollWidth),
        publicPage.path,
      ).toBeLessThanOrEqual(windowWidth);
    }
  });
}
