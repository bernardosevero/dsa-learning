import { index, layout, route, type RouteConfig } from "@react-router/dev/routes";

// Practice screens share the client-only practice app; public pages and 404 render without it.
export default [
  // Public pages share their own layout, prerendered at build time.
  layout("routes/publicLayout.tsx", [
    index("routes/landing.tsx"),
    route("how-it-works", "routes/howItWorks.tsx"),
    route("privacy", "routes/privacy.tsx"),
  ]),
  layout("routes/practiceApp.tsx", [
    // Every sheet is the same width; Today's sidebar and the Problems table use all of it.
    layout("routes/appLayout.tsx", [
      route("today", "routes/today.tsx"),
      route("problems", "routes/problems.tsx"),
    ]),
    // Screens of text and forms keep to a readable column inside the same sheet.
    layout("routes/readableAppLayout.tsx", [
      route("problems/:problemId", "routes/problemDetail.tsx"),
      route("settings", "routes/settings.tsx"),
    ]),
    // Solving and Log have their own frame: the design replaces the top bar to keep the user on the problem.
    route("solve/:problemId", "routes/solving.tsx"),
    route("log/:problemId", "routes/log.tsx"),
  ]),
  route("*", "routes/notFound.tsx"),
] satisfies RouteConfig;
