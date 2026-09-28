import { Route, Routes } from "react-router";

import { AppLayout } from "./AppLayout";
import { LogPage } from "@/ui/screens/log/LogPage";
import { PlaceholderPage } from "./PlaceholderPage";
import { SolvingPage } from "@/ui/screens/solving/SolvingPage";
import { t } from "@/ui/shared/strings";
import { TodayPage } from "@/ui/screens/today/TodayPage";

/** The six screens: Solving and Log in their own frame, the rest inside the shared layout. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        <Route path="problems" element={<PlaceholderPage title={t.pages.problems} />} />
        <Route
          path="problems/:problemId"
          element={<PlaceholderPage title={t.pages.problemDetail} />}
        />
        <Route path="settings" element={<PlaceholderPage title={t.pages.settings} />} />
      </Route>
      {/* Solving and Log have their own frame: the design replaces the top bar to keep the user on the problem. */}
      <Route path="solve/:problemId" element={<SolvingPage />} />
      <Route path="log/:problemId" element={<LogPage />} />
    </Routes>
  );
}
