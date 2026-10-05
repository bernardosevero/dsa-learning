import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

// Practice screens share the client-only practice app; public pages and 404 render without it.
export default [
  layout("routes/practiceApp.tsx", [
    // Every sheet is the same width; Today's sidebar and the Problems table use all of it, while
    // Problem detail and Settings keep to a readable column (their route handles say so).
    layout("routes/appLayout.tsx", [
      index("routes/today.tsx"),
      route("problems", "routes/problems.tsx"),
      route("problems/:problemId", "routes/problemDetail.tsx"),
      route("settings", "routes/settings.tsx"),
    ]),
    // Solving and Log have their own frame: the design replaces the top bar to keep the user on the problem.
    route("solve/:problemId", "routes/solving.tsx"),
    route("log/:problemId", "routes/log.tsx"),
  ]),
  route("privacy", "routes/privacy.tsx"),
  route("*", "routes/notFound.tsx"),
] satisfies RouteConfig;
