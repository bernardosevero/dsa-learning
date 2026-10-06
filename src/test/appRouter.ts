import type { RouteConfigEntry } from "@react-router/dev/routes";
import { createElement, Fragment, type ComponentType } from "react";
import { createMemoryRouter, Outlet, type RouteObject } from "react-router";

import routes from "@/routes";
import { AnalyticsRouteTracker } from "@/ui/app/AnalyticsRouteTracker";
import { PracticeApp, type PracticeAppProps } from "@/ui/app/PracticeApp";

interface RouteModule {
  default: ComponentType;
}

// The real route modules, keyed the way src/routes.ts names them ("routes/today.tsx").
const ROUTE_MODULES = import.meta.glob<RouteModule>("../routes/*.tsx", { eager: true });
const PRACTICE_APP_FILE = "routes/practiceApp.tsx";

function findRouteModule(file: string): RouteModule {
  const routeModule = ROUTE_MODULES[`../${file}`];
  if (routeModule === undefined) {
    throw new Error(`src/routes.ts names ${file}, which has no module in src/routes`);
  }
  return routeModule;
}

/**
 * Returns a memory router over the app's real root and route config (src/routes.ts) at `initialPath`. The
 * practice app gets `practiceAppProps` (a fake account, say) in place of the build's backend.
 */
export function createAppRouter(initialPath: string, practiceAppProps: PracticeAppProps = {}) {
  function TestPracticeApp() {
    return createElement(PracticeApp, practiceAppProps);
  }

  function toRouteObject(entry: RouteConfigEntry): RouteObject {
    const routeModule = findRouteModule(entry.file);
    const Component = entry.file === PRACTICE_APP_FILE ? TestPracticeApp : routeModule.default;
    if (entry.index === true) {
      return { index: true, Component };
    }
    return { path: entry.path, Component, children: entry.children?.map(toRouteObject) };
  }

  // What src/root.tsx renders around every route, without the HTML document.
  function TestRoot() {
    return createElement(
      Fragment,
      null,
      createElement(AnalyticsRouteTracker),
      createElement(Outlet),
    );
  }

  return createMemoryRouter([{ Component: TestRoot, children: routes.map(toRouteObject) }], {
    initialEntries: [initialPath],
  });
}
