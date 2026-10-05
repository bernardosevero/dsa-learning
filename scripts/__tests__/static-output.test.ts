import { describe, expect, it } from "vitest";

import {
  buildHeaders,
  buildRedirects,
  buildRobotsTxt,
  buildSitemap,
  listPracticePaths,
  removeScripts,
} from "../static-output.ts";

const PRODUCTION_URL = "https://dsa-learning.bernardosevero.dev";
const INDEXED_ENV = { VITE_SITE_URL: PRODUCTION_URL, VITE_PUBLIC_INDEXING_ENABLED: "true" };

// Cloudflare's _headers placeholders (":name") match one host label; "*" matches the rest.
function matchesHeadersRule(rule: string, url: string): boolean {
  const pattern = rule
    .replaceAll(".", String.raw`\.`)
    .replaceAll(/:\w+/g, "[^./]+")
    .replaceAll("*", ".*");
  return new RegExp(`^${pattern}$`).test(url);
}

describe("listPracticePaths", () => {
  it("lists the fixed practice addresses and each problem's detail, Solving and Log address", () => {
    const paths = listPracticePaths(["two-sum", "valid-anagram"]);

    expect(paths).toEqual([
      "/today",
      "/problems",
      "/settings",
      "/problems/two-sum",
      "/problems/valid-anagram",
      "/solve/two-sum",
      "/solve/valid-anagram",
      "/log/two-sum",
      "/log/valid-anagram",
    ]);
  });
});

describe("buildRedirects", () => {
  it("serves the app shell at a practice address and redirects its trailing-slash form", () => {
    const redirects = buildRedirects(["two-sum"]);

    expect(redirects.split("\n")).toContain("/solve/two-sum /__spa-fallback 200");
    expect(redirects.split("\n")).toContain("/solve/two-sum/ /solve/two-sum 301");
  });

  it("serves the app shell at /today and has no catch-all rule", () => {
    const redirects = buildRedirects(["two-sum"]);

    expect(redirects.split("\n")).toContain("/today /__spa-fallback 200");
    expect(redirects).not.toContain("*");
  });

  it("sends /404 to an address with no file, so it answers with a real 404", () => {
    const redirects = buildRedirects(["two-sum"]);

    expect(redirects.split("\n")[0]).toBe("/404 /not-found 301");
  });

  it("never names a public page, so they keep their prerendered HTML", () => {
    const redirects = buildRedirects(["two-sum"]);

    expect(redirects).not.toMatch(/^\/privacy/m);
    expect(redirects).not.toMatch(/^\/how-it-works/m);
    expect(redirects).not.toMatch(/^\/ /m);
  });

  it("ends with a newline and stays under Cloudflare's 2,000 static rules for 150 problems", () => {
    const problemIds = Array.from({ length: 150 }, (_unused, index) => `problem-${index}`);

    const redirects = buildRedirects(problemIds);

    expect(redirects.endsWith("\n")).toBe(true);
    expect(redirects.trimEnd().split("\n").length).toBeLessThanOrEqual(2000);
  });
});

describe("buildHeaders", () => {
  const rules = buildHeaders()
    .split("\n")
    .filter((line) => line !== "" && !line.startsWith(" "));

  it("marks every header rule noindex", () => {
    const headers = buildHeaders();

    expect(headers.match(/X-Robots-Tag: noindex/g)).toHaveLength(rules.length);
  });

  it.each([
    "https://dsa-learning.bernardoseverosilveira.workers.dev/",
    "https://dsa-learning.bernardoseverosilveira.workers.dev/today",
    "https://claude-optimistic-edison-08lnu2-dsa-learning.bernardoseverosilveira.workers.dev/how-it-works",
    "https://65f6d37b-dsa-learning.bernardoseverosilveira.workers.dev/privacy",
  ])("keeps the workers.dev address %s out of search results", (url) => {
    expect(rules.some((rule) => matchesHeadersRule(rule, url))).toBe(true);
  });

  it("leaves the canonical domain's public pages to their own robots tag", () => {
    const publicUrls = [`${PRODUCTION_URL}/`, `${PRODUCTION_URL}/how-it-works`];

    for (const url of publicUrls) {
      expect(rules.some((rule) => matchesHeadersRule(rule, url))).toBe(false);
    }
  });

  it("keeps the app shell's own addresses out of search results", () => {
    expect(rules).toContain("/__spa-fallback*");
  });
});

describe("buildRobotsTxt", () => {
  it("allows every crawler everywhere and points at the canonical sitemap", () => {
    const robots = buildRobotsTxt({ VITE_SITE_URL: "" });

    expect(robots).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${PRODUCTION_URL}/sitemap.xml\n`);
    expect(robots).not.toContain("Disallow");
  });
});

describe("buildSitemap", () => {
  it("lists exactly the three canonical public URLs, without lastmod, when indexing is on", () => {
    const sitemap = buildSitemap(INDEXED_ENV);

    expect([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])).toEqual([
      `${PRODUCTION_URL}/`,
      `${PRODUCTION_URL}/how-it-works`,
      `${PRODUCTION_URL}/privacy`,
    ]);
    expect(sitemap).not.toContain("lastmod");
  });

  it.each([undefined, "", "false", "TRUE", "1"])(
    "lists no URL when the indexing flag is %s",
    (flag) => {
      const sitemap = buildSitemap({ VITE_PUBLIC_INDEXING_ENABLED: flag });

      expect(sitemap).not.toContain("<url>");
      expect(sitemap).toContain("<urlset");
    },
  );
});

describe("removeScripts", () => {
  it("drops inline and module scripts and their preloads, keeping content and styles", () => {
    const html = [
      '<head><link rel="stylesheet" href="/assets/index.css"/>',
      '<link rel="modulepreload" href="/assets/root.js"/></head>',
      '<body><h1>Page not found</h1><a href="/">Go to the app</a>',
      "<script>window.__reactRouterContext = {};</script>",
      '<script type="module" async="">import "/assets/root.js";</script></body>',
    ].join("");

    const page = removeScripts(html);

    expect(page).toBe(
      '<head><link rel="stylesheet" href="/assets/index.css"/></head>' +
        '<body><h1>Page not found</h1><a href="/">Go to the app</a></body>',
    );
  });
});
