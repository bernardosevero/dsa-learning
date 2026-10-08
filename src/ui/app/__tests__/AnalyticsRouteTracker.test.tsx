import { act, render } from "@testing-library/react";
import { StrictMode } from "react";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SETTINGS } from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";
import { setUsageSharing } from "@/storage/usageSharing";
import { aSaveFile } from "@/test/builders";
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

function storeSharing(isEnabled: boolean): void {
  const settings = { ...DEFAULT_SETTINGS, shareAnonymousUsage: isEnabled };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(aSaveFile({ settings })));
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

// useUsageSharing reads storage once its module has loaded; this waits for that read.
async function loadStoredChoice() {
  await act(async () => {
    await import("@/storage/usageSharing");
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
  it("never enables analytics or sends anything on a public visit when sharing is off", async () => {
    storeSharing(false);

    renderTrackerAt("/");
    await loadStoredChoice();

    expect(setAnalyticsEnabled).not.toHaveBeenCalledWith(true);
    expect(trackPageView).not.toHaveBeenCalled();
    expect(trackAppOpened).not.toHaveBeenCalled();
  });

  it("sends one pageview for a public page, even under StrictMode, and no app_opened", async () => {
    storeSharing(true);

    renderTrackerAt("/how-it-works");
    await loadStoredChoice();

    expect(setAnalyticsEnabled).toHaveBeenCalledWith(true);
    expect(trackPageView).toHaveBeenCalledExactlyOnceWith("/how-it-works");
    expect(trackAppOpened).not.toHaveBeenCalled();
  });

  it("follows a visit from a public page into practice pages", async () => {
    storeSharing(true);
    const router = renderTrackerAt("/");
    await loadStoredChoice();

    await navigate(router, "/today");
    await navigate(router, "/problems");

    expect(vi.mocked(trackPageView).mock.calls).toEqual([["/"], ["/today"], ["/problems"]]);
    // analytics.ts sends app_opened only on the first of these calls in a document.
    expect(trackAppOpened).toHaveBeenCalledTimes(2);
  });

  it("ignores query and fragment changes on the same page", async () => {
    storeSharing(true);
    const router = renderTrackerAt("/today");
    await loadStoredChoice();

    await navigate(router, "/today?code=oauth-secret");
    await navigate(router, "/today#top");

    expect(trackPageView).toHaveBeenCalledExactlyOnceWith("/today");
  });

  it("doesn't replay the pageview when the choice is turned off and on again", async () => {
    storeSharing(true);
    renderTrackerAt("/settings");
    await loadStoredChoice();

    act(() => {
      setUsageSharing(false);
    });
    act(() => {
      setUsageSharing(true);
    });

    expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(true);
    expect(setAnalyticsEnabled).toHaveBeenCalledWith(false);
    expect(trackPageView).toHaveBeenCalledExactlyOnceWith("/settings");
  });

  it("applies a choice turned off on the page right away", async () => {
    storeSharing(true);
    renderTrackerAt("/privacy");
    await loadStoredChoice();

    act(() => {
      setUsageSharing(false);
    });

    expect(setAnalyticsEnabled).toHaveBeenLastCalledWith(false);
  });
});
