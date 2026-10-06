import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthog }));

const ORIGIN = "https://app.example";
// What an OAuth return or a shared link can carry; none of it may reach PostHog.
const SENSITIVE_QUERY = "?code=oauth-secret&utm_source=newsletter";

const AN_ATTEMPT = {
  rating: "medium",
  help: "none",
  isReview: false,
  daysOverdue: 0,
  timeMinutes: 20,
  pattern: "Arrays & Hashing",
  isFirstAttempt: true,
} as const;

async function importConfiguredAnalytics() {
  vi.stubEnv("PROD", true);
  vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
  return import("../analytics");
}

function capturedEvents(): unknown[] {
  return posthog.capture.mock.calls.map(([event]: unknown[]) => event);
}

beforeEach(() => {
  vi.stubGlobal("window", {
    location: { origin: ORIGIN, pathname: "/today", search: SENSITIVE_QUERY, hash: "#top" },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("anonymous analytics", () => {
  it("uses memory-only persistence and captures an explicit SPA pageview", async () => {
    const { setAnalyticsEnabled, trackPageView } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);
    trackPageView("/problems/two-sum");

    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        persistence: "memory",
        cookieless_mode: "always",
        ip: false,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        person_profiles: "never",
        save_campaign_params: false,
        save_referrer: false,
      }),
    );
    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith("$pageview", {
      $current_url: `${ORIGIN}/problems/two-sum`,
    });
  });

  it("keeps query strings, fragments and OAuth codes out of the current URL", async () => {
    const { setAnalyticsEnabled } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);
    const [, config] = posthog.init.mock.calls[0] as [string, { get_current_url: () => string }]; // safe: init was just called with its config

    expect(config.get_current_url()).toBe(`${ORIGIN}/today`);
  });

  it("never initializes or sends anything while the saved choice is off", async () => {
    const { setAnalyticsEnabled, trackAppOpened, trackPageView, trackStartPracticing } =
      await importConfiguredAnalytics();

    setAnalyticsEnabled(false);
    trackPageView("/");
    trackStartPracticing("/", "hero");
    trackAppOpened();

    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("doesn't count turning sharing on as opening the app", async () => {
    const { setAnalyticsEnabled } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);
    setAnalyticsEnabled(true);

    expect(posthog.init).toHaveBeenCalledOnce();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("sends app_opened once per document, however often a practice page asks", async () => {
    const { setAnalyticsEnabled, trackAppOpened } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);
    trackAppOpened();
    trackAppOpened();

    expect(capturedEvents()).toEqual(["app_opened"]);
  });

  it("sends Start practicing with only its page and placement", async () => {
    const { setAnalyticsEnabled, trackStartPracticing } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);
    trackStartPracticing("/how-it-works", "footer");

    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith("start_practicing_clicked", {
      sourcePath: "/how-it-works",
      placement: "footer",
    });
  });

  it("marks an attempt as started from a public page only after a captured click", async () => {
    const { setAnalyticsEnabled, trackAttemptLogged, trackStartPracticing } =
      await importConfiguredAnalytics();

    setAnalyticsEnabled(true);
    trackAttemptLogged(AN_ATTEMPT);
    trackStartPracticing("/", "hero");
    trackAttemptLogged(AN_ATTEMPT);

    const attempts = posthog.capture.mock.calls.filter(([event]) => event === "attempt_logged");
    expect(attempts).toEqual([
      ["attempt_logged", { ...AN_ATTEMPT, startedFromPublicPage: false }],
      ["attempt_logged", { ...AN_ATTEMPT, startedFromPublicPage: true }],
    ]);
  });

  it("forgets the click on opt-out, and re-enabling without a new click leaves it false", async () => {
    const { setAnalyticsEnabled, trackAttemptLogged, trackStartPracticing } =
      await importConfiguredAnalytics();
    setAnalyticsEnabled(true);
    trackStartPracticing("/", "hero");

    setAnalyticsEnabled(false);
    trackAttemptLogged(AN_ATTEMPT);
    setAnalyticsEnabled(true);
    trackAttemptLogged(AN_ATTEMPT);

    expect(posthog.capture).toHaveBeenLastCalledWith("attempt_logged", {
      ...AN_ATTEMPT,
      startedFromPublicPage: false,
    });
    expect(capturedEvents()).toEqual(["start_practicing_clicked", "attempt_logged"]);
  });

  it("remembers nothing from a click that wasn't captured", async () => {
    const { setAnalyticsEnabled, trackAttemptLogged, trackStartPracticing } =
      await importConfiguredAnalytics();

    setAnalyticsEnabled(false);
    trackStartPracticing("/", "hero");
    setAnalyticsEnabled(true);
    trackAttemptLogged(AN_ATTEMPT);

    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith("attempt_logged", {
      ...AN_ATTEMPT,
      startedFromPublicPage: false,
    });
  });

  it("stops pageviews and events at once after opt-out", async () => {
    const { setAnalyticsEnabled, track, trackPageView } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);
    trackPageView("/");
    track("imported", { added: 2 });
    setAnalyticsEnabled(false);
    track("exported");
    trackPageView("/settings");

    expect(capturedEvents()).toEqual(["$pageview", "imported"]);
    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
  });

  it("does nothing without a production project key", async () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_POSTHOG_KEY", "");
    const { setAnalyticsEnabled, track, trackAppOpened, trackStartPracticing } =
      await import("../analytics");

    setAnalyticsEnabled(true);
    track("exported");
    trackAppOpened();
    trackStartPracticing("/", "hero");

    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});

describe("toPublicAcquisitionPath", () => {
  it.each([
    ["/", "/"],
    ["/how-it-works", "/how-it-works"],
    ["/privacy", undefined],
    ["/today", undefined],
  ])("reads %s as %s", async (pathname, expected) => {
    const { toPublicAcquisitionPath } = await import("../analytics");

    expect(toPublicAcquisitionPath(pathname)).toBe(expected);
  });
});
