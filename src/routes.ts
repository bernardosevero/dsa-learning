import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

// Practice screens share the client-only practice app; public pages and 404 render without it.
export default [
  layout("framework/appState.tsx", [
    // Every sheet is the same width; Today's sidebar and the Problems table use all of it, while
    // Problem detail and Settings keep to a readable column (their route handles say so).
    layout("framework/appLayout.tsx", [
      index("framework/today.tsx"),
      route("problems", "framework/problems.tsx"),
      route("problems/:problemId", "framework/problemDetail.tsx"),
      route("settings", "framework/settings.tsx"),
    ]),
    // Solving and Log have their own frame: the design replaces the top bar to keep the user on the problem.
    route("solve/:problemId", "framework/solving.tsx"),
    route("log/:problemId", "framework/log.tsx"),
  ]),
  route("privacy", "framework/privacy.tsx"),
  route("*", "framework/notFound.tsx"),
] satisfies RouteConfig;
