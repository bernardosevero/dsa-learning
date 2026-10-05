import type { RouteConfigEntry } from "@react-router/dev/routes";
import { createElement, type ComponentType } from "react";
import { createMemoryRouter, type RouteObject } from "react-router";

import routes from "@/routes";
import { PracticeApp, type PracticeAppProps } from "@/ui/app/PracticeApp";

interface RouteModule {
  default: ComponentType;
}

// The real route adapters, keyed the way src/routes.ts names them ("framework/today.tsx").
const ROUTE_MODULES = import.meta.glob<RouteModule>("../framework/*.tsx", { eager: true });
const APP_STATE_FILE = "framework/appState.tsx";

function findRouteComponent(file: string): ComponentType {
  const routeModule = ROUTE_MODULES[`../${file}`];
  if (routeModule === undefined) {
    throw new Error(`src/routes.ts names ${file}, which has no module in src/framework`);
  }
  return routeModule.default;
}

/**
 * Returns a memory router over the app's real route config (src/routes.ts) at `initialPath`. The
 * practice app gets `practiceAppProps` (a fake account, say) in place of the build's backend.
 */
export function createAppRouter(initialPath: string, practiceAppProps: PracticeAppProps = {}) {
  function TestAppState() {
    return createElement(PracticeApp, practiceAppProps);
  }

  function toRouteObject(entry: RouteConfigEntry): RouteObject {
    const Component = entry.file === APP_STATE_FILE ? TestAppState : findRouteComponent(entry.file);
    if (entry.index === true) {
      return { index: true, Component };
    }
    return { path: entry.path, Component, children: entry.children?.map(toRouteObject) };
  }

  return createMemoryRouter(routes.map(toRouteObject), { initialEntries: [initialPath] });
}
