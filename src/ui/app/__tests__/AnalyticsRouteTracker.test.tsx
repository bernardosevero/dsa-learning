import { act, render } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { setUsageConsent, USAGE_CONSENT_KEY, type UsageAnswer } from "@/storage/usageConsent";
import { setAnalyticsEnabled, trackAppOpened, trackPageView } from "@/ui/shared/analytics";

import { AnalyticsRouteTracker } from "../AnalyticsRouteTracker";

vi.mock("@/ui/shared/analytics", () => ({
  setAnalyticsEnabled: vi.fn(),
  trackPageView: vi.fn(),
  trackAppOpened: vi.fn(),
}));

function Root() {
  return (
    <>
      <AnalyticsRouteTracker />
      <Outlet />
    </>
  );
}

function storeAnswer(answer: UsageAnswer): void {
  localStorage.setItem(USAGE_CONSENT_KEY, answer);
}

function renderTrackerAt(path: string) {
  const router = createMemoryRouter(
    [{ Component: Root, children: [{ path: "*", Component: () => null }] }],
    { initialEntries: [path] },
  );
  render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  );
  return router;
}

// useUsageConsent reads storage once its module has loaded; this waits for that read.
async function loadStoredChoice() {
  await act(async () => {
    await import("@/storage/usageConsent");
  });
}

async function navigate(router: ReturnType<typeof renderTrackerAt>, to: string) {
  await act(async () => {
    await router.navigate(to);
  });
}

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("AnalyticsRouteTracker", () => {
  it("never enables analytics or sends anything before the visitor answers", async () => {
    renderTrackerAt("/");
    await loadStoredChoice();

    expect(setAnalyticsEnabled).not.toHaveBeenCalledWith(true);
    expect(trackPageView).not.toHaveBeenCalled();
    expect(trackAppOpened).not.toHaveBeenCalled();
  });

  it("never enables analytics or sends anything after a Decline", async () => {
    storeAnswer("declined");

    renderTrackerAt("/today");
    await loadStoredChoice();

    expect(setAnalyticsEnabled).not.toHaveBeenCalledWith(true);
    expect(trackPageView).not.toHaveBeenCalled();
    expect(trackAppOpened).not.toHaveBeenCalled();
  });

  it("sends one pageview for a public page once accepted, even under StrictMode, and no app_opened", async () => {
    storeAnswer("accepted");

    renderTrackerAt("/how-it-works");
    await loadStoredChoice();

    expect(setAnalyticsEnabled).toHaveBeenCalledWith(true);
    expect(trackPageView).toHaveBeenCalledExactlyOnceWith("/how-it-works");
    expect(trackAppOpened).not.toHaveBeenCalled();
  });

  it("follows a visit from a public page into practice pages", async () => {
    storeAnswer("accepted");
    const router = renderTrackerAt("/");
    await loadStoredChoice();

    await navigate(router, "/today");
    await navigate(router, "/problems");

    expect(vi.mocked(trackPageView).mock.calls).toEqual([["/"], ["/today"], ["/problems"]]);
    // analytics.ts sends app_opened only on the first of these calls in a document.
    expect(trackAppOpened).toHaveBeenCalledTimes(2);
  });

  it("ignores query and fragment changes on the same page", async () => {
    storeAnswer("accepted");
    const router = renderTrackerAt("/today");
    await loadStoredChoice();

    await navigate(router, "/today?code=oauth-secret");
    await navigate(router, "/today#top");

    expect(trackPageView).toHaveBeenCalledExactlyOnceWith("/today");
  });

  it("doesn't replay the pageview when sharing is turned off and on again", async () => {
    storeAnswer("accepted");
    renderTrackerAt("/settings");
    await loadStoredChoice();

    act(() => {
      setUsageConsent("declined");
    });
    act(() => {
      setUsageConsent("accepted");
    });

    expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(true);
    expect(setAnalyticsEnabled).toHaveBeenCalledWith(false);
    expect(trackPageView).toHaveBeenCalledExactlyOnceWith("/settings");
  });

  it("applies a Decline made on the page right away", async () => {
    storeAnswer("accepted");
    renderTrackerAt("/privacy");
    await loadStoredChoice();

    act(() => {
      setUsageConsent("declined");
    });

    expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(false);
  });

  it("sends the page's first pageview once the visitor accepts on it", async () => {
    renderTrackerAt("/today");
    await loadStoredChoice();

    act(() => {
      setUsageConsent("accepted");
    });

    expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(true);
    expect(trackPageView).toHaveBeenCalledExactlyOnceWith("/today");
    expect(trackAppOpened).toHaveBeenCalledOnce();
  });
});
