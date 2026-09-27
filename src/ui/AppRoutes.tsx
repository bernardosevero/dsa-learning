import { Route, Routes } from "react-router";

import { AppLayout } from "./AppLayout";
import { PlaceholderPage } from "./PlaceholderPage";
import { SolvingPage } from "./solving/SolvingPage";
import { t } from "./strings";
import { TodayPage } from "./today/TodayPage";

/** The six screens: Solving in its own frame, the rest inside the shared layout. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        <Route path="log/:problemId" element={<PlaceholderPage title={t.pages.logAttempt} />} />
        <Route path="problems" element={<PlaceholderPage title={t.pages.problems} />} />
        <Route
          path="problems/:problemId"
          element={<PlaceholderPage title={t.pages.problemDetail} />}
        />
        <Route path="settings" element={<PlaceholderPage title={t.pages.settings} />} />
      </Route>
      {/* Solving has its own frame: the design replaces the top bar to keep the user on the problem. */}
      <Route path="solve/:problemId" element={<SolvingPage />} />
    </Routes>
  );
}
