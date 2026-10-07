import { StrictMode, type ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { AnalyticsRouteTracker } from "@/ui/app/AnalyticsRouteTracker";
import { AppLoading } from "@/ui/app/AppLoading";
import { DocumentHead } from "@/ui/app/DocumentHead";
import { buildPrivatePageMeta } from "@/ui/shared/publicPageMetadata";

import stylesheetUrl from "./index.css?url";
import type { Route } from "./+types/root";

export const links: Route.LinksFunction = () => [{ rel: "stylesheet", href: stylesheetUrl }];

// Practice screens, the app shell and 404 are never indexed; public routes replace these tags.
export const meta: Route.MetaFunction = () => buildPrivatePageMeta(import.meta.env);

/** The HTML document around every page, prerendered or client-rendered. */
export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <DocumentHead />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return (
    <StrictMode>
      {/* Above public and practice routes alike, so one tracker follows a visit between them. */}
      <AnalyticsRouteTracker />
      <Outlet />
    </StrictMode>
  );
}

// The app shell (index.html) shows this until the client takes over and renders the route.
export function HydrateFallback() {
  return <AppLoading />;
}
