import { Route, Routes } from "react-router";

import { LogPage } from "@/ui/screens/log/LogPage";
import { ProblemDetailPage } from "@/ui/screens/problemDetail/ProblemDetailPage";
import { ProblemsPage } from "@/ui/screens/problems/ProblemsPage";
import { SettingsPage } from "@/ui/screens/settings/SettingsPage";
import { SolvingPage } from "@/ui/screens/solving/SolvingPage";
import { TodayPage } from "@/ui/screens/today/TodayPage";

import { AppLayout } from "./AppLayout";

/** The six screens: Solving and Log in their own frame, the rest inside the shared layout. */
export function AppRoutes() {
  return (
    <Routes>
      {/* Only Today's sheet widens on wide windows, for its sidebar. */}
      <Route element={<AppLayout isWide />}>
        <Route index element={<TodayPage />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="problems" element={<ProblemsPage />} />
        <Route path="problems/:problemId" element={<ProblemDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      {/* Solving and Log have their own frame: the design replaces the top bar to keep the user on the problem. */}
      <Route path="solve/:problemId" element={<SolvingPage />} />
      <Route path="log/:problemId" element={<LogPage />} />
    </Routes>
  );
}
