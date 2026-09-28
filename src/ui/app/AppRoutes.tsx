import { Route, Routes } from "react-router";

import { LogPage } from "@/ui/screens/log/LogPage";
import { ProblemDetailPage } from "@/ui/screens/problemDetail/ProblemDetailPage";
import { ProblemsPage } from "@/ui/screens/problems/ProblemsPage";
import { SolvingPage } from "@/ui/screens/solving/SolvingPage";
import { TodayPage } from "@/ui/screens/today/TodayPage";
import { t } from "@/ui/shared/strings";

import { AppLayout } from "./AppLayout";
import { PlaceholderPage } from "./PlaceholderPage";

/** The six screens: Solving and Log in their own frame, the rest inside the shared layout. */
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<TodayPage />} />
        <Route path="problems" element={<ProblemsPage />} />
        <Route path="problems/:problemId" element={<ProblemDetailPage />} />
        <Route path="settings" element={<PlaceholderPage title={t.pages.settings} />} />
      </Route>
      {/* Solving and Log have their own frame: the design replaces the top bar to keep the user on the problem. */}
      <Route path="solve/:problemId" element={<SolvingPage />} />
      <Route path="log/:problemId" element={<LogPage />} />
    </Routes>
  );
}
