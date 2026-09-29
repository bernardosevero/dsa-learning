import { afterEach, describe, expect, it, vi } from "vitest";

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
}));

vi.mock("posthog-js", () => ({ default: posthog }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("anonymous analytics", () => {
  it("lets the SDK capture the initial page and later history changes when enabled at startup", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
    const { setAnalyticsEnabled } = await import("../analytics");

    setAnalyticsEnabled(true);

    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({ capture_pageview: "history_change" }),
    );
    expect(posthog.capture).toHaveBeenCalledTimes(1);
    expect(posthog.capture).toHaveBeenCalledWith("app_opened", undefined);
  });

  it("starts opted out and sends only requested events after the user opts in", async () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_POSTHOG_KEY", "phc_test");
    vi.stubEnv("VITE_POSTHOG_HOST", "https://us.i.posthog.com");
    const { setAnalyticsEnabled, track } = await import("../analytics");

    setAnalyticsEnabled(false);
    track("exported");
    setAnalyticsEnabled(true);
    track("imported", { added: 2 });
    setAnalyticsEnabled(false);
    track("exported");

    expect(posthog.init).toHaveBeenCalledWith(
      "phc_test",
      expect.objectContaining({
        autocapture: false,
        capture_pageview: "history_change",
        disable_session_recording: true,
        person_profiles: "never",
        opt_out_capturing_by_default: true,
      }),
    );
    expect(posthog.capture).toHaveBeenCalledTimes(3);
    expect(posthog.capture).toHaveBeenNthCalledWith(1, "$pageview");
    expect(posthog.capture).toHaveBeenNthCalledWith(2, "app_opened", undefined);
    expect(posthog.capture).toHaveBeenNthCalledWith(3, "imported", { added: 2 });
    expect(posthog.opt_out_capturing).toHaveBeenCalledTimes(2);
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
