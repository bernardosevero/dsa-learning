import posthog from "posthog-js";

import type { Help, Rating } from "@/domain/types";

export type PublicAcquisitionPath = "/" | "/how-it-works";
export type StartPracticingPlacement = "hero" | "footer";

/** What the Log screen knows about a saved attempt; the helper adds the acquisition flag. */
export interface AttemptLoggedProperties {
  rating: Rating;
  help: Help;
  isReview: boolean;
  daysOverdue: number;
  timeMinutes: number;
  pattern: string;
  /** True when the local log, before this save, held no attempt at all, deleted ones included. */
  isFirstAttempt: boolean;
}

interface AnalyticsEvents {
  app_opened: undefined;
  start_practicing_clicked: {
    sourcePath: PublicAcquisitionPath;
    placement: StartPracticingPlacement;
  };
  attempt_logged: AttemptLoggedProperties & { startedFromPublicPage: boolean };
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
// Set by a captured Start practicing click; lives only as long as this document.
let isStartedFromPublicPage = false;

const PUBLIC_ACQUISITION_PATHS: readonly string[] = ["/", "/how-it-works"];

/** Returns the pathname as a public page that can lead into the app, or undefined. */
export function toPublicAcquisitionPath(pathname: string): PublicAcquisitionPath | undefined {
  return PUBLIC_ACQUISITION_PATHS.includes(pathname)
    ? (pathname as PublicAcquisitionPath) // safe: just checked against the list of its values
    : undefined;
}

function canCapture(): boolean {
  return isConfigured && isInitialized && shouldShareUsage;
}

/**
 * Applies the saved opt-out choice before any event can be sent. Turning it off stops capture at
 * once and forgets a Start practicing click, so re-enabling never brings an earlier one back.
 */
export function setAnalyticsEnabled(isEnabled: boolean): void {
  if (!isConfigured) return;

  shouldShareUsage = isEnabled;
  if (!isEnabled) {
    isStartedFromPublicPage = false;
    return;
  }
  if (isInitialized) return;

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
}

/** Sends app_opened once per document, on the first practice route while sharing is on. */
export function trackAppOpened(): void {
  if (!canCapture() || hasTrackedOpening) return;
  hasTrackedOpening = true;
  track("app_opened");
}

/**
 * Sends start_practicing_clicked with only its page and placement, and remembers for this document
 * that the visit came through it. Nothing is remembered when the click isn't captured.
 */
export function trackStartPracticing(
  sourcePath: PublicAcquisitionPath,
  placement: StartPracticingPlacement,
): void {
  if (!canCapture()) return;
  track("start_practicing_clicked", { sourcePath, placement });
  isStartedFromPublicPage = true;
}

/** Sends attempt_logged with whether this document's visit came through Start practicing. */
export function trackAttemptLogged(properties: Readonly<AttemptLoggedProperties>): void {
  track("attempt_logged", { ...properties, startedFromPublicPage: isStartedFromPublicPage });
}

/** Captures the current SPA route without query strings or fragments. */
export function trackPageView(pathname: string): void {
  if (!canCapture()) return;
  posthog.capture("$pageview", { $current_url: window.location.origin + pathname });
}

/** Sends only the listed anonymous product events when analytics is enabled. */
export function track<EventName extends keyof AnalyticsEvents>(
  event: EventName,
  ...args: AnalyticsEvents[EventName] extends undefined ? [] : [AnalyticsEvents[EventName]]
): void {
  if (!canCapture()) return;
  posthog.capture(event, args[0]);
}
