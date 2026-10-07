import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const CANONICAL_ORIGIN = "https://dsa-learning.bernardosevero.dev";
const PUBLIC_PATHS = ["/", "/how-it-works", "/privacy"] as const;
const PRACTICE_PATHS = ["/today", "/problems", "/problems/two-sum", "/settings"] as const;
const HEADERS_FILE_URL = new URL("../../build-release/client/_headers", import.meta.url);
// Hosts the release build must never call: analytics and the account backend.
const THIRD_PARTY_HOSTS = ["posthog.com", "supabase.co"] as const;

function readHeadAttribute(page: Page, selector: string, attribute: string) {
  return page.locator(`head ${selector}`).getAttribute(attribute);
}

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const path of PUBLIC_PATHS) {
    test(`${path} may be indexed, with exactly one of each head tag`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await readHeadAttribute(page, "meta[name=robots]", "content")).toBe("index,follow");
      expect(await readHeadAttribute(page, "link[rel=canonical]", "href")).toBe(
        `${CANONICAL_ORIGIN}${path}`,
      );
      for (const selector of [
        "title",
        "meta[name=robots]",
        "meta[name=description]",
        "link[rel=canonical]",
        "meta[property='og:title']",
        "meta[property='og:url']",
        "meta[name='twitter:card']",
      ]) {
        await expect(page.locator(`head ${selector}`), selector).toHaveCount(1);
      }
    });
  }

  for (const path of PRACTICE_PATHS) {
    test(`${path} stays noindex even with public indexing on`, async ({ page }) => {
      const response = await page.goto(path);

      expect(response?.status()).toBe(200);
      expect(await readHeadAttribute(page, "meta[name=robots]", "content")).toBe("noindex");
      await expect(page.locator("head link[rel=canonical]")).toHaveCount(0);
    });
  }
});

test("the sitemap lists exactly the three canonical public URLs", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();

  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  expect(urls).toEqual(PUBLIC_PATHS.map((path) => `${CANONICAL_ORIGIN}${path}`));
});

test("robots.txt allows every crawler and points at the canonical sitemap", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();

  expect(robots).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${CANONICAL_ORIGIN}/sitemap.xml\n`);
});

test("the built _headers keeps workers.dev hosts and the app shell noindex", async () => {
  const headers = await readFile(HEADERS_FILE_URL, "utf8");

  expect(headers).toContain("https://:version.:subdomain.workers.dev/*\n  X-Robots-Tag: noindex");
  expect(headers).toContain("/__spa-fallback*\n  X-Robots-Tag: noindex");
});

test("unknown public paths and problem IDs answer with a real 404", async ({ request }) => {
  for (const path of ["/how-it-work", "/problems/not-a-problem", "/log/not-a-problem"]) {
    const response = await request.get(path);

    expect(response.status(), path).toBe(404);
    expect(await response.text(), path).toContain('<meta name="robots" content="noindex"/>');
  }
});

test("head tags and JSON-LD stay right through client navigation", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("script[type='application/ld+json']")).toHaveCount(1);

  await page
    .getByRole("navigation", { name: "Site" })
    .getByRole("link", { name: "How it works" })
    .click();
  await expect(page).toHaveTitle("How spaced-repetition practice works | dsa-learning");
  await expect(page.locator("script[type='application/ld+json']")).toHaveCount(0);
  expect(await readHeadAttribute(page, "meta[name=robots]", "content")).toBe("index,follow");
  await expect(page.locator("head link[rel=canonical]")).toHaveCount(1);

  await page.getByRole("link", { name: "Start practicing" }).click();
  await expect(page).toHaveTitle("Today · dsa-learning");
  expect(await readHeadAttribute(page, "meta[name=robots]", "content")).toBe("noindex");
  await expect(page.locator("head link[rel=canonical]")).toHaveCount(0);
});

test("public pages hydrate without errors and call no analytics or account backend", async ({
  page,
}) => {
  const errors: string[] = [];
  const thirdPartyRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (THIRD_PARTY_HOSTS.some((host) => new URL(request.url()).hostname.endsWith(host))) {
      thirdPartyRequests.push(request.url());
    }
  });

  for (const path of PUBLIC_PATHS) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
  await page.getByRole("switch", { name: "Share usage data" }).waitFor();

  expect(errors).toEqual([]);
  expect(thirdPartyRequests).toEqual([]);
});

test("the prerendered HTML carries no practice data or keys", async ({ request }) => {
  for (const path of PUBLIC_PATHS) {
    const html = await (await request.get(path)).text();

    expect(html, path).not.toContain("dsa-learning:v1");
    expect(html, path).not.toMatch(/phc_[A-Za-z0-9]/);
    expect(html, path).not.toContain("supabase.co");
  }
});
