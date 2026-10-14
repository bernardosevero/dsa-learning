import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ANONYMOUS_ID = "anonymous-visitor";

// Follows the distinct ID the way posthog-js does: identify takes the account's, reset a new one.
const posthog = vi.hoisted(() => {
  const state = { distinctId: "anonymous-visitor" };
  return {
    state,
    init: vi.fn(),
    capture: vi.fn(),
    set_config: vi.fn(),
    get_distinct_id: vi.fn(() => state.distinctId),
    identify: vi.fn((distinctId: string) => {
      state.distinctId = distinctId;
    }),
    reset: vi.fn(() => {
      state.distinctId = "new-anonymous-visitor";
    }),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
  };
});

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
  posthog.state.distinctId = ANONYMOUS_ID;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("analytics after consent", () => {
  it("keeps a random visitor ID in localStorage, sets no cookies and sends an SPA pageview", async () => {
    const { setAnalyticsEnabled, trackPageView } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);

    await vi.dynamicImportSettled();
    trackPageView("/problems/two-sum");

    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        persistence: "localStorage",
        disable_persistence: false,
        ip: false,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        person_profiles: "identified_only",
        save_campaign_params: false,
        save_referrer: false,
      }),
    );
    expect(posthog.init.mock.calls[0]?.[1]).not.toHaveProperty("cookieless_mode");
    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith("$pageview", {
      $current_url: `${ORIGIN}/problems/two-sum`,
    });
  });

  it("keeps query strings, fragments and OAuth codes out of the current URL", async () => {
    const { setAnalyticsEnabled } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);

    await vi.dynamicImportSettled();
    const [, config] = posthog.init.mock.calls[0] as [string, { get_current_url: () => string }]; // safe: init was just called with its config

    expect(config.get_current_url()).toBe(`${ORIGIN}/today`);
  });

  it("never initializes or sends anything until the visitor accepts", async () => {
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

    await vi.dynamicImportSettled();
    setAnalyticsEnabled(true);
    await vi.dynamicImportSettled();

    expect(posthog.init).toHaveBeenCalledOnce();
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("sends app_opened once per document, however often a practice page asks", async () => {
    const { setAnalyticsEnabled, trackAppOpened } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);

    await vi.dynamicImportSettled();
    trackAppOpened();
    trackAppOpened();

    expect(capturedEvents()).toEqual(["app_opened"]);
  });

  it("sends Start practicing with only its page and placement", async () => {
    const { setAnalyticsEnabled, trackStartPracticing } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);

    await vi.dynamicImportSettled();
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

    await vi.dynamicImportSettled();
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
    await vi.dynamicImportSettled();
    trackStartPracticing("/", "hero");

    setAnalyticsEnabled(false);
    trackAttemptLogged(AN_ATTEMPT);
    setAnalyticsEnabled(true);
    await vi.dynamicImportSettled();
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
    await vi.dynamicImportSettled();
    trackAttemptLogged(AN_ATTEMPT);

    expect(posthog.capture).toHaveBeenCalledExactlyOnceWith("attempt_logged", {
      ...AN_ATTEMPT,
      startedFromPublicPage: false,
    });
  });

  it("stops pageviews and events at once after opt-out", async () => {
    const { setAnalyticsEnabled, track, trackPageView } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);

    await vi.dynamicImportSettled();
    trackPageView("/");
    track("imported", { added: 2 });
    setAnalyticsEnabled(false);
    track("exported");
    trackPageView("/settings");

    expect(capturedEvents()).toEqual(["$pageview", "imported"]);
    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
  });

  it("forgets the visitor ID and stops storing one when consent is withdrawn", async () => {
    const { setAnalyticsEnabled } = await importConfiguredAnalytics();
    setAnalyticsEnabled(true);
    await vi.dynamicImportSettled();

    setAnalyticsEnabled(false);

    expect(posthog.reset).toHaveBeenCalledOnce();
    expect(posthog.set_config).toHaveBeenCalledExactlyOnceWith({ disable_persistence: true });
  });

  it("does nothing more when the same answer is applied again", async () => {
    const { setAnalyticsEnabled } = await importConfiguredAnalytics();
    setAnalyticsEnabled(true);
    await vi.dynamicImportSettled();
    setAnalyticsEnabled(false);

    setAnalyticsEnabled(false);

    expect(posthog.reset).toHaveBeenCalledOnce();
    expect(posthog.set_config).toHaveBeenCalledOnce();
  });

  it("stores a visitor ID again when the visitor accepts again in the same visit", async () => {
    const { setAnalyticsEnabled, track } = await importConfiguredAnalytics();
    setAnalyticsEnabled(true);
    await vi.dynamicImportSettled();
    setAnalyticsEnabled(false);

    setAnalyticsEnabled(true);
    track("exported");

    expect(posthog.set_config).toHaveBeenLastCalledWith({ disable_persistence: false });
    expect(posthog.init).toHaveBeenCalledOnce();
    expect(capturedEvents()).toEqual(["exported"]);
  });

  it("does nothing without a production project key", async () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_POSTHOG_KEY", "");
    const { setAnalyticsEnabled, track, trackAppOpened, trackStartPracticing } =
      await import("../analytics");

    setAnalyticsEnabled(true);

    await vi.dynamicImportSettled();
    track("exported");
    trackAppOpened();
    trackStartPracticing("/", "hero");

    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});

describe("loading posthog-js", () => {
  it("doesn't download posthog-js until sharing is on in a configured build", async () => {
    const { setAnalyticsEnabled, trackPageView } = await importConfiguredAnalytics();

    setAnalyticsEnabled(false);
    trackPageView("/");
    await vi.dynamicImportSettled();

    expect(posthog.init).not.toHaveBeenCalled();
  });

  it("sends events made while it loads once it has, in order", async () => {
    const { setAnalyticsEnabled, trackAppOpened, trackPageView } =
      await importConfiguredAnalytics();

    setAnalyticsEnabled(true);
    trackPageView("/today");
    trackAppOpened();
    await vi.dynamicImportSettled();

    expect(capturedEvents()).toEqual(["$pageview", "app_opened"]);
  });

  it("drops waiting events and any stored visitor ID when sharing is turned off before it loads", async () => {
    const { setAnalyticsEnabled, trackPageView } = await importConfiguredAnalytics();

    setAnalyticsEnabled(true);
    trackPageView("/today");
    setAnalyticsEnabled(false);
    await vi.dynamicImportSettled();

    expect(posthog.init).toHaveBeenCalledOnce();
    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ disable_persistence: true }),
    );
    expect(posthog.reset).toHaveBeenCalledOnce();
    expect(posthog.set_config).toHaveBeenCalledExactlyOnceWith({ disable_persistence: true });
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});

describe("linking usage to the account", () => {
  const USER_ID = "user-uuid";

  async function importSharingAnalytics() {
    const analytics = await importConfiguredAnalytics();
    analytics.setAnalyticsEnabled(true);
    await vi.dynamicImportSettled();
    return analytics;
  }

  it("identifies a linked account by its id alone", async () => {
    const { setAnalyticsAccount } = await importSharingAnalytics();

    setAnalyticsAccount({ status: "signedIn", userId: USER_ID, link: "on" });

    expect(posthog.identify).toHaveBeenCalledExactlyOnceWith(USER_ID);
  });

  it("waits for the account's own settings before linking or resetting", async () => {
    const { setAnalyticsAccount } = await importSharingAnalytics();

    setAnalyticsAccount({ status: "signedIn", userId: USER_ID, link: "pending" });

    expect(posthog.identify).not.toHaveBeenCalled();
    expect(posthog.reset).not.toHaveBeenCalled();
  });

  it("doesn't link while sharing is off, then links once the visitor accepts", async () => {
    const { setAnalyticsAccount, setAnalyticsEnabled } = await importConfiguredAnalytics();

    setAnalyticsAccount({ status: "signedIn", userId: USER_ID, link: "on" });
    setAnalyticsEnabled(true);
    await vi.dynamicImportSettled();

    expect(posthog.identify).toHaveBeenCalledExactlyOnceWith(USER_ID);
  });

  it("doesn't identify again a visitor already identified as that account", async () => {
    posthog.state.distinctId = USER_ID;
    const { setAnalyticsAccount } = await importSharingAnalytics();

    setAnalyticsAccount({ status: "signedIn", userId: USER_ID, link: "on" });

    expect(posthog.identify).not.toHaveBeenCalled();
  });

  it.each([
    ["linking is turned off", { status: "signedIn", userId: USER_ID, link: "off" }],
    ["the user signs out", { status: "signedOut" }],
  ] as const)("resets to a new random ID when %s", async (_change, nextAccount) => {
    const { setAnalyticsAccount } = await importSharingAnalytics();
    setAnalyticsAccount({ status: "signedIn", userId: USER_ID, link: "on" });

    setAnalyticsAccount(nextAccount);

    expect(posthog.reset).toHaveBeenCalledOnce();
    expect(posthog.state.distinctId).not.toBe(USER_ID);
  });

  it("resets a link kept from an earlier visit once the account's settings say it's off", async () => {
    posthog.state.distinctId = USER_ID;
    const { setAnalyticsAccount } = await importSharingAnalytics();

    setAnalyticsAccount({ status: "signedIn", userId: USER_ID, link: "off" });

    expect(posthog.reset).toHaveBeenCalledOnce();
  });

  it("never resets an anonymous visitor on sign-out or with linking off", async () => {
    const { setAnalyticsAccount } = await importSharingAnalytics();

    setAnalyticsAccount({ status: "signedOut" });
    setAnalyticsAccount({ status: "signedIn", userId: USER_ID, link: "off" });
    setAnalyticsAccount({ status: "signedOut" });

    expect(posthog.reset).not.toHaveBeenCalled();
    expect(posthog.identify).not.toHaveBeenCalled();
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
