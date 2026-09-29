import posthog from "posthog-js";

import type { Help, Rating } from "@/domain/types";

interface AnalyticsEvents {
  app_opened: undefined;
  attempt_logged: {
    rating: Rating;
    help: Help;
    isReview: boolean;
    daysOverdue: number;
    timeMinutes: number;
    pattern: string;
  };
  marked_mastered: { pattern: string };
  exported: undefined;
  imported: { added: number };
}

const configuredKey: unknown = import.meta.env.VITE_POSTHOG_KEY;
const projectKey = typeof configuredKey === "string" ? configuredKey : "";
const configuredHost: unknown = import.meta.env.VITE_POSTHOG_HOST;
const posthogHost =
  typeof configuredHost === "string" && configuredHost !== ""
    ? configuredHost
    : "https://us.i.posthog.com";
const isConfigured = import.meta.env.PROD && Boolean(projectKey);
let isInitialized = false;
let hasTrackedOpening = false;
let shouldShareUsage = false;

/** Applies the saved opt-out choice before any app event can be sent. */
export function setAnalyticsEnabled(isEnabled: boolean): void {
  if (!isConfigured) return;

  shouldShareUsage = isEnabled;
  if (!isEnabled || isInitialized) return;

  posthog.init(projectKey, {
    api_host: posthogHost,
    persistence: "memory",
    cookieless_mode: "always",
    // Deprecated upstream: this cannot prevent the server from seeing the request IP.
    ip: false,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_exceptions: false,
    disable_session_recording: true,
    person_profiles: "never",
    advanced_disable_flags: true,
    disable_surveys: true,
    save_campaign_params: false,
    save_referrer: false,
    get_current_url: () => window.location.origin + window.location.pathname,
  });
  isInitialized = true;
  if (!hasTrackedOpening) {
    hasTrackedOpening = true;
    track("app_opened");
  }
}

/** Captures the current SPA route without query strings or fragments. */
export function trackPageView(pathname: string): void {
  if (!isConfigured || !isInitialized || !shouldShareUsage) return;
  posthog.capture("$pageview", { $current_url: window.location.origin + pathname });
}

/** Sends only the listed anonymous product events when analytics is enabled. */
export function track<EventName extends keyof AnalyticsEvents>(
  event: EventName,
  ...args: AnalyticsEvents[EventName] extends undefined ? [] : [AnalyticsEvents[EventName]]
): void {
  if (!isConfigured || !isInitialized || !shouldShareUsage) return;
  posthog.capture(event, args[0]);
}
