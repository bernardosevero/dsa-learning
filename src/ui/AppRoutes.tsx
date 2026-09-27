import { Route, Routes } from "react-router";

import { AppLayout } from "./AppLayout";
import { PlaceholderPage } from "./PlaceholderPage";
import { t } from "./strings";
import { TodayPage } from "./today/TodayPage";

/** The six screens, inside the shared layout. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        <Route path="solve/:problemId" element={<PlaceholderPage title={t.pages.solving} />} />
        <Route path="log/:problemId" element={<PlaceholderPage title={t.pages.logAttempt} />} />
        <Route path="problems" element={<PlaceholderPage title={t.pages.problems} />} />
        <Route
          path="problems/:problemId"
          element={<PlaceholderPage title={t.pages.problemDetail} />}
        />
        <Route path="settings" element={<PlaceholderPage title={t.pages.settings} />} />
      </Route>
    </Routes>
  );
}
