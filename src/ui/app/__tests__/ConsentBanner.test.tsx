import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { MemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { readUsageConsent, USAGE_CONSENT_KEY } from "@/storage/usageConsent";
import { createAppRouter } from "@/test/appRouter";
import { isAnalyticsConfigured, setAnalyticsEnabled } from "@/ui/shared/analytics";

import { ConsentBanner } from "../ConsentBanner";

vi.mock("@/ui/shared/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/ui/shared/analytics")>()),
  isAnalyticsConfigured: vi.fn(() => true),
  setAnalyticsEnabled: vi.fn(),
  setAnalyticsAccount: vi.fn(),
  trackPageView: vi.fn(),
  trackAppOpened: vi.fn(),
}));

function bannerElement() {
  return (
    <MemoryRouter>
      <ConsentBanner />
    </MemoryRouter>
  );
}

// The banner waits for the saved answer, which useUsageConsent reads once its module has loaded.
async function loadStoredAnswer() {
  await act(async () => {
    await import("@/storage/usageConsent");
  });
}

function queryBanner(): HTMLElement | null {
  return screen.queryByRole("region", { name: "Share usage data?" });
}

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("ConsentBanner", () => {
  it.each(["/", "/how-it-works", "/privacy", "/today", "/settings", "/solve/two-sum"])(
    "asks on %s before the visitor answers",
    async (path) => {
      render(<RouterProvider router={createAppRouter(path)} />);

      await loadStoredAnswer();

      expect(queryBanner()).not.toBeNull();
    },
  );

  it("isn't in the server HTML or the first browser render, so it never shifts the page", () => {
    expect(renderToString(bannerElement())).toBe("");
  });

  it("offers Accept and Decline with the same weight, and links to what's sent", async () => {
    render(bannerElement());
    await loadStoredAnswer();

    const accept = screen.getByRole("button", { name: "Accept" });
    const decline = screen.getByRole("button", { name: "Decline" });

    expect(accept.className).toBe(decline.className);
    expect(screen.getByRole("link", { name: "See what's sent" }).getAttribute("href")).toBe(
      "/privacy",
    );
  });

  it("saves an Accept for this browser, turns analytics on and goes away", async () => {
    render(bannerElement());
    await loadStoredAnswer();

    await userEvent.click(screen.getByRole("button", { name: "Accept" }));

    expect(setAnalyticsEnabled).toHaveBeenCalledExactlyOnceWith(true);
    expect(readUsageConsent()).toBe("accepted");
    expect(queryBanner()).toBeNull();
  });

  it("saves a Decline for this browser, keeps analytics off and goes away", async () => {
    render(bannerElement());
    await loadStoredAnswer();

    await userEvent.click(screen.getByRole("button", { name: "Decline" }));

    expect(setAnalyticsEnabled).toHaveBeenCalledExactlyOnceWith(false);
    expect(readUsageConsent()).toBe("declined");
    expect(queryBanner()).toBeNull();
  });

  it.each(["accepted", "declined"])("doesn't ask again once %s", async (answer) => {
    localStorage.setItem(USAGE_CONSENT_KEY, answer);

    render(bannerElement());
    await loadStoredAnswer();

    expect(queryBanner()).toBeNull();
  });

  it("never asks in a build that sends no analytics", async () => {
    vi.mocked(isAnalyticsConfigured).mockReturnValue(false);

    render(bannerElement());
    await loadStoredAnswer();

    expect(queryBanner()).toBeNull();
  });
});
