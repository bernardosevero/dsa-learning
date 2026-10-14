import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { MemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { readUsageConsent, USAGE_CONSENT_KEY } from "@/storage/usageConsent";
import { createAppRouter } from "@/test/appRouter";
import { isAnalyticsConfigured, setAnalyticsEnabled } from "@/ui/shared/analytics";

import { AnalyticsConsent } from "../AnalyticsConsent";

vi.mock("@/ui/shared/analytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/ui/shared/analytics")>()),
  isAnalyticsConfigured: vi.fn(() => true),
  setAnalyticsEnabled: vi.fn(),
  setAnalyticsAccount: vi.fn(),
  trackPageView: vi.fn(),
  trackAppOpened: vi.fn(),
}));

const BANNER = { name: "Share usage data?" } as const;

function consentElement() {
  return (
    <MemoryRouter>
      <AnalyticsConsent />
    </MemoryRouter>
  );
}

// Waits for the saved answer, which useUsageConsent reads once its module has loaded, and for the
// banner's own code, which loads only when there's something to ask.
async function settle() {
  await act(async () => {
    await import("@/storage/usageConsent");
    await import("../ConsentBanner");
  });
}

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("AnalyticsConsent", () => {
  it.each(["/", "/how-it-works", "/privacy", "/today", "/settings", "/solve/two-sum"])(
    "asks on %s before the visitor answers",
    async (path) => {
      render(<RouterProvider router={createAppRouter(path)} />);

      expect(await screen.findByRole("region", BANNER)).toBeDefined();
    },
  );

  it("isn't in the server HTML or the first browser render, so it never shifts the page", () => {
    expect(renderToString(consentElement())).toBe("");
  });

  it("offers Accept and Decline with the same weight, and links to what's sent", async () => {
    render(consentElement());

    const banner = within(await screen.findByRole("region", BANNER));

    expect(banner.getByRole("button", { name: "Accept" }).className).toBe(
      banner.getByRole("button", { name: "Decline" }).className,
    );
    expect(banner.getByRole("link", { name: "See what's sent" }).getAttribute("href")).toBe(
      "/privacy",
    );
  });

  it("saves an Accept for this browser, turns analytics on and goes away", async () => {
    render(consentElement());
    await screen.findByRole("region", BANNER);

    await userEvent.click(screen.getByRole("button", { name: "Accept" }));

    expect(setAnalyticsEnabled).toHaveBeenCalledExactlyOnceWith(true);
    expect(readUsageConsent()).toBe("accepted");
    expect(screen.queryByRole("region", BANNER)).toBeNull();
  });

  it("saves a Decline for this browser, keeps analytics off and goes away", async () => {
    render(consentElement());
    await screen.findByRole("region", BANNER);

    await userEvent.click(screen.getByRole("button", { name: "Decline" }));

    expect(setAnalyticsEnabled).toHaveBeenCalledExactlyOnceWith(false);
    expect(readUsageConsent()).toBe("declined");
    expect(screen.queryByRole("region", BANNER)).toBeNull();
  });

  it.each(["accepted", "declined"])("doesn't ask again once %s", async (answer) => {
    localStorage.setItem(USAGE_CONSENT_KEY, answer);

    render(consentElement());
    await settle();

    expect(screen.queryByRole("region", BANNER)).toBeNull();
  });

  it("never asks in a build that sends no analytics", async () => {
    vi.mocked(isAnalyticsConfigured).mockReturnValue(false);

    render(consentElement());
    await settle();

    expect(screen.queryByRole("region", BANNER)).toBeNull();
  });
});
