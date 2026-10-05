import { describe, expect, it } from "vitest";

import { buildRedirects, listPracticePaths } from "../static-output.ts";

describe("listPracticePaths", () => {
  it("lists the fixed practice addresses and each problem's detail, Solving and Log address", () => {
    const paths = listPracticePaths(["two-sum", "valid-anagram"]);

    expect(paths).toEqual([
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

    expect(redirects.split("\n")).toContain("/solve/two-sum / 200");
    expect(redirects.split("\n")).toContain("/solve/two-sum/ /solve/two-sum 301");
  });

  it("never names /privacy or a public page, so they keep their prerendered HTML", () => {
    const redirects = buildRedirects(["two-sum"]);

    expect(redirects).not.toMatch(/^\/privacy/m);
    expect(redirects).not.toMatch(/^\/ /m);
  });

  it("ends with a newline and stays under Cloudflare's 2,000 static rules for 150 problems", () => {
    const problemIds = Array.from({ length: 150 }, (_unused, index) => `problem-${index}`);

    const redirects = buildRedirects(problemIds);

    expect(redirects.endsWith("\n")).toBe(true);
    expect(redirects.trimEnd().split("\n").length).toBeLessThanOrEqual(2000);
  });
});
