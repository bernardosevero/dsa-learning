import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";

import { useAppData } from "@/ui/app/AppData";
import { LogPage } from "@/ui/screens/log/LogPage";
import { ProblemDetailPage } from "@/ui/screens/problemDetail/ProblemDetailPage";
import { PrivacyPage } from "@/ui/screens/privacy/PrivacyPage";
import { ProblemsPage } from "@/ui/screens/problems/ProblemsPage";
import { SettingsPage } from "@/ui/screens/settings/SettingsPage";
import { SolvingPage } from "@/ui/screens/solving/SolvingPage";
import { TodayPage } from "@/ui/screens/today/TodayPage";
import { setAnalyticsEnabled, trackPageView } from "@/ui/shared/analytics";

import { AppLayout } from "./AppLayout";

/** The six screens: Solving and Log in their own frame, the rest inside the shared layout. */
export function AppRoutes() {
  return (
    <>
      <AnalyticsRouteTracker />
      <Routes>
        {/* Every sheet is the same width; Today's sidebar and the Problems table use all of it. */}
        <Route element={<AppLayout />}>
          <Route index element={<TodayPage />} />
          <Route path="problems" element={<ProblemsPage />} />
        </Route>
        <Route element={<AppLayout isReadable />}>
          <Route path="problems/:problemId" element={<ProblemDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
        </Route>
        {/* Solving and Log have their own frame: the design replaces the top bar to keep the user on the problem. */}
        <Route path="solve/:problemId" element={<SolvingPage />} />
        <Route path="log/:problemId" element={<LogPage />} />
      </Routes>
    </>
  );
}

function AnalyticsRouteTracker() {
  const { file } = useAppData();
  const location = useLocation();

  useEffect(() => {
    setAnalyticsEnabled(file.settings.shareAnonymousUsage);
    trackPageView(location.pathname);
  }, [file.settings.shareAnonymousUsage, location.pathname]);

  return null;
}
