import { afterEach, describe, expect, it, vi } from "vitest";

import { readBundleConfig, readSupabaseConfig } from "../smoke-production.ts";

const SITE_URL = "https://dsa-learning.example";
const SUPABASE_URL = "https://abcdefgh.supabase.co";
const PUBLISHABLE_KEY = "sb_publishable_test-key";
const CONFIG_SCRIPT = `const url="${SUPABASE_URL}",key="${PUBLISHABLE_KEY}";`;

// Answers each address with its body from the table, and 404 for any other.
function stubSite(bodiesByUrl: Readonly<Record<string, string>>): string[] {
  const requestedUrls: string[] = [];
  vi.stubGlobal("fetch", (url: string) => {
    requestedUrls.push(url);
    const body = bodiesByUrl[url];
    return Promise.resolve(
      body === undefined ? new Response(null, { status: 404 }) : new Response(body),
    );
  });
  return requestedUrls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readSupabaseConfig", () => {
  it("reads the Supabase URL and publishable key from a script", () => {
    const config = readSupabaseConfig(CONFIG_SCRIPT);

    expect(config).toEqual({ url: SUPABASE_URL, publishableKey: PUBLISHABLE_KEY });
  });

  it("returns undefined when the script has the URL but no key", () => {
    const config = readSupabaseConfig(`const url="${SUPABASE_URL}";`);

    expect(config).toBeUndefined();
  });
});

describe("readBundleConfig", () => {
  it("finds the config in a later chunk when the first chunk the page links has none", async () => {
    stubSite({
      [`${SITE_URL}/`]:
        '<script type="module" src="/assets/entry.client-A1.js"></script>' +
        '<link rel="modulepreload" href="/assets/root-B2.js">',
      [`${SITE_URL}/assets/entry.client-A1.js`]: "export const unrelated = 1;",
      [`${SITE_URL}/assets/root-B2.js`]: CONFIG_SCRIPT,
    });

    const config = await readBundleConfig(`${SITE_URL}/`);

    expect(config).toEqual({ url: SUPABASE_URL, publishableKey: PUBLISHABLE_KEY });
  });

  it("stops reading chunks once one carries the config", async () => {
    const requestedUrls = stubSite({
      [`${SITE_URL}/`]:
        '<link rel="modulepreload" href="/assets/root-B2.js">' +
        '<link rel="modulepreload" href="/assets/landing-C3.js">',
      [`${SITE_URL}/assets/root-B2.js`]: CONFIG_SCRIPT,
    });

    await readBundleConfig(`${SITE_URL}/`);

    expect(requestedUrls).not.toContain(`${SITE_URL}/assets/landing-C3.js`);
  });

  it("returns undefined when no chunk the page links carries the config", async () => {
    stubSite({
      [`${SITE_URL}/`]: '<link rel="modulepreload" href="/assets/root-B2.js">',
      [`${SITE_URL}/assets/root-B2.js`]: "export const unrelated = 1;",
    });

    const config = await readBundleConfig(`${SITE_URL}/`);

    expect(config).toBeUndefined();
  });
});
