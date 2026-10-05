import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

import { setAnalyticsEnabled, trackPageView } from "@/ui/shared/analytics";

import { AppDataProvider, useAppData, type AppDataProviderProps } from "./AppData";

export type PracticeAppProps = Omit<AppDataProviderProps, "children">;

/**
 * The practice screens' shared state around the current screen: the save file, the account and
 * analytics. It stays mounted while the user moves between practice screens. Browser only.
 */
export function PracticeApp({ accountService, remoteStore }: PracticeAppProps) {
  return (
    <AppDataProvider accountService={accountService} remoteStore={remoteStore}>
      <AnalyticsRouteTracker />
      <Outlet />
    </AppDataProvider>
  );
}

function AnalyticsRouteTracker() {
  const { file } = useAppData();
  const location = useLocation();

  useEffect(() => {
    setAnalyticsEnabled(file.settings.shareAnonymousUsage);
  }, [file.settings.shareAnonymousUsage]);

  // Keyed on the path alone: changing the setting on the same page is not a new pageview.
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
}
