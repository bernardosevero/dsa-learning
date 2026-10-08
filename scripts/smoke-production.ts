/**
 * Checks that the live site is wired to Supabase, without signing in: the build has the project's
 * URL and key, GitHub sign-in is on, and the saves table and delete_my_account() are migrated and
 * closed to anyone signed out.
 *
 * Run with `pnpm tsx scripts/smoke-production.ts [site URL]` (default: production).
 * Prints one line per check and exits with 1 if any fails.
 */

const DEFAULT_SITE_URL = "https://dsa-learning.bernardosevero.dev";
const SUPABASE_URL_PATTERN = /https:\/\/[a-z0-9]+\.supabase\.co/;
const PUBLISHABLE_KEY_PATTERN = /sb_publishable_[\w-]+/;
// The framework build splits the app into chunks; the page links each one it loads.
const SCRIPT_PATH_PATTERN = /\/assets\/[\w.-]+\.js/g;
// Postgres' insufficient_privilege, what RLS and the revoked grants answer to the anon role.
const PERMISSION_DENIED = "42501";
const HTTP_REDIRECT_MIN = 300;
const HTTP_REDIRECT_MAX = 399;

type CheckResult = { ok: true; detail: string } | { ok: false; detail: string };

interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} answered ${response.status}`);
  }
  return response.text();
}

function readSupabaseConfig(script: string): SupabaseConfig | undefined {
  const url = SUPABASE_URL_PATTERN.exec(script)?.[0];
  const publishableKey = PUBLISHABLE_KEY_PATTERN.exec(script)?.[0];
  return url === undefined || publishableKey === undefined ? undefined : { url, publishableKey };
}

async function readBundleConfig(siteUrl: string): Promise<SupabaseConfig | undefined> {
  const html = await fetchText(siteUrl);
  const scriptPaths = new Set(html.match(SCRIPT_PATH_PATTERN));
  for (const scriptPath of scriptPaths) {
    const config = readSupabaseConfig(await fetchText(new URL(scriptPath, siteUrl).href));
    if (config !== undefined) {
      return config;
    }
  }
  return undefined;
}

async function checkGitHubEnabled(config: SupabaseConfig): Promise<CheckResult> {
  const response = await fetch(`${config.url}/auth/v1/settings`, {
    headers: { apikey: config.publishableKey },
  });
  const settings = (await response.json()) as { external?: { github?: boolean } }; // safe: only read
  return settings.external?.github === true
    ? { ok: true, detail: "GitHub sign-in is enabled" }
    : {
        ok: false,
        detail: "GitHub sign-in is not enabled in Supabase → Authentication → Providers",
      };
}

async function checkAuthorizeRedirect(
  config: SupabaseConfig,
  siteUrl: string,
): Promise<CheckResult> {
  const authorizeUrl = new URL(`${config.url}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "github");
  authorizeUrl.searchParams.set("redirect_to", siteUrl);
  const response = await fetch(authorizeUrl, {
    headers: { apikey: config.publishableKey },
    redirect: "manual",
  });
  const location = response.headers.get("location") ?? "";
  const isRedirect = response.status >= HTTP_REDIRECT_MIN && response.status <= HTTP_REDIRECT_MAX;
  return isRedirect && location.startsWith("https://github.com/login/oauth/authorize")
    ? { ok: true, detail: "Sign-in sends you to GitHub" }
    : { ok: false, detail: `Sign-in answered ${response.status}, not a redirect to GitHub` };
}

async function checkDeniedToAnon(
  config: SupabaseConfig,
  label: string,
  path: string,
  init: RequestInit,
): Promise<CheckResult> {
  const response = await fetch(`${config.url}${path}`, {
    ...init,
    headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
  });
  const body = (await response.json()) as { code?: string }; // safe: only read
  return body.code === PERMISSION_DENIED
    ? { ok: true, detail: `${label} exists and is closed to anyone signed out` }
    : { ok: false, detail: `${label} answered ${response.status} ${JSON.stringify(body)}` };
}

async function runChecks(siteUrl: string): Promise<CheckResult[]> {
  const config = await readBundleConfig(siteUrl);
  if (config === undefined) {
    return [
      {
        ok: false,
        detail: "The build has no Supabase URL or publishable key: set the Worker build variables",
      },
    ];
  }
  return [
    { ok: true, detail: `The build points at ${config.url}` },
    await checkGitHubEnabled(config),
    await checkAuthorizeRedirect(config, siteUrl),
    await checkDeniedToAnon(config, "The saves table", "/rest/v1/saves?select=version", {}),
    await checkDeniedToAnon(config, "delete_my_account()", "/rest/v1/rpc/delete_my_account", {
      method: "POST",
      body: "{}",
    }),
  ];
}

const siteUrl = process.argv[2] ?? DEFAULT_SITE_URL;
const results = await runChecks(siteUrl);
for (const result of results) {
  console.error(`${result.ok ? "✅" : "❌"} ${result.detail}`);
}
process.exitCode = results.every((result) => result.ok) ? 0 : 1;
