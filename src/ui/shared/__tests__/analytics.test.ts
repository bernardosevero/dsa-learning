import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthog }));

beforeEach(() => {
  vi.stubGlobal("window", { location: { origin: "https://app.example", pathname: "/" } });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("anonymous analytics", () => {
  it("uses memory-only persistence and captures an explicit SPA pageview", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
    const { setAnalyticsEnabled, trackPageView } = await import("../analytics");

    setAnalyticsEnabled(true);
    trackPageView("/problems/two-sum");

    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        persistence: "memory",
        cookieless_mode: "always",
        ip: false,
        capture_pageview: false,
        disable_session_recording: true,
      }),
    );
    expect(posthog.capture).toHaveBeenCalledTimes(2);
    expect(posthog.capture).toHaveBeenNthCalledWith(1, "app_opened", undefined);
    expect(posthog.capture).toHaveBeenNthCalledWith(2, "$pageview", {
      $current_url: `${window.location.origin}/problems/two-sum`,
    });
  });

  it("does not initialize when disabled and stops pageviews and events after opt-out", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
    vi.stubEnv("VITE_POSTHOG_HOST", "https://us.i.posthog.com");
    const { setAnalyticsEnabled, track, trackPageView } = await import("../analytics");

    setAnalyticsEnabled(false);
    track("exported");
    trackPageView("/");
    expect(posthog.init).not.toHaveBeenCalled();

    setAnalyticsEnabled(true);
    trackPageView("/");
    track("imported", { added: 2 });
    setAnalyticsEnabled(false);
    track("exported");
    trackPageView("/settings");

    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_exceptions: false,
        disable_session_recording: true,
        person_profiles: "never",
        persistence: "memory",
        cookieless_mode: "always",
        ip: false,
        advanced_disable_flags: true,
      }),
    );
    expect(posthog.capture).toHaveBeenCalledTimes(3);
    expect(posthog.capture).toHaveBeenNthCalledWith(1, "app_opened", undefined);
    expect(posthog.capture).toHaveBeenNthCalledWith(2, "$pageview", {
      $current_url: `${window.location.origin}/`,
    });
    expect(posthog.capture).toHaveBeenNthCalledWith(3, "imported", { added: 2 });
    expect(posthog.opt_in_capturing).not.toHaveBeenCalled();
    expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
  });

  it("does nothing without a production project key", async () => {
    vi.stubEnv("PROD", false);
    vi.stubEnv("VITE_POSTHOG_KEY", "");
    const { setAnalyticsEnabled, track } = await import("../analytics");

    setAnalyticsEnabled(true);
    track("exported");

    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.capture).not.toHaveBeenCalled();
  });
});
