import type { PostHog, Properties } from "posthog-js";

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

/** What the practice app knows about the account, for linking analytics to it. */
export type AnalyticsAccount =
  | { status: "signedOut" }
  // "pending" until the account's own settings have synced, so another user's choice never links.
  | { status: "signedIn"; userId: string; link: "pending" | "on" | "off" };

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
// posthog-js is loaded on first use, so a build without a key, a visitor who hasn't accepted and
// every page's first paint never download it. Events sent while it loads wait in the queue.
let hasStartedLoading = false;
let hasLoadFailed = false;
let client: PostHog | undefined;
let pendingCaptures: Array<[event: string, properties: Properties | undefined]> = [];
let hasTrackedOpening = false;
let shouldShareUsage = false;
// Set by a captured Start practicing click; lives only as long as this document.
let isStartedFromPublicPage = false;
let account: AnalyticsAccount = { status: "signedOut" };
// The last user signed in during this document: the only identity a sign-out or unlink resets.
let lastSignedInUserId: string | undefined;

/** Returns whether this build sends analytics at all, so the consent banner has something to ask. */
export function isAnalyticsConfigured(): boolean {
  return isConfigured;
}

const PUBLIC_ACQUISITION_PATHS: readonly string[] = ["/", "/how-it-works"];

/** Returns the pathname as a public page that can lead into the app, or undefined. */
export function toPublicAcquisitionPath(pathname: string): PublicAcquisitionPath | undefined {
  return PUBLIC_ACQUISITION_PATHS.includes(pathname)
    ? (pathname as PublicAcquisitionPath) // safe: just checked against the list of its values
    : undefined;
}

function canCapture(): boolean {
  return isConfigured && hasStartedLoading && !hasLoadFailed && shouldShareUsage;
}

function capture(event: string, properties?: Properties): void {
  if (client === undefined) {
    pendingCaptures.push([event, properties]);
    return;
  }
  client.capture(event, properties);
}

// Only an identity this app set is ever reset: the user who signed in here, now unlinked or gone.
function applyAccountLink(posthog: PostHog): void {
  const distinctId = posthog.get_distinct_id();
  if (account.status === "signedIn" && account.link === "on") {
    if (distinctId !== account.userId) {
      posthog.identify(account.userId);
    }
    return;
  }
  const isWaitingForSettings = account.status === "signedIn" && account.link === "pending";
  if (!isWaitingForSettings && distinctId === lastSignedInUserId) {
    posthog.reset();
  }
}

// Withdrawn consent: a new random ID replaces the old one, and none stays in the browser.
function forgetVisitor(posthog: PostHog): void {
  posthog.reset();
  posthog.set_config({ disable_persistence: true });
}

function rememberVisitor(posthog: PostHog): void {
  posthog.set_config({ disable_persistence: false });
  applyAccountLink(posthog);
}

function initialize(posthog: PostHog): void {
  posthog.init(projectKey, {
    api_host: posthogHost,
    // A random visitor ID in localStorage, and no cookies. A Decline while loading stores nothing.
    persistence: "localStorage",
    disable_persistence: !shouldShareUsage,
    // Deprecated upstream: this cannot prevent the server from seeing the request IP.
    ip: false,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_exceptions: false,
    disable_session_recording: true,
    // Visitors stay anonymous; only a linked account gets a person profile, under its id.
    person_profiles: "identified_only",
    advanced_disable_flags: true,
    disable_surveys: true,
    save_campaign_params: false,
    save_referrer: false,
    get_current_url: () => window.location.origin + window.location.pathname,
  });
  client = posthog;
  if (shouldShareUsage) {
    applyAccountLink(posthog);
  } else {
    // Declined while loading: an ID an earlier visit stored goes too.
    forgetVisitor(posthog);
  }
  const queued = pendingCaptures;
  pendingCaptures = [];
  for (const [event, properties] of queued) {
    posthog.capture(event, properties);
  }
}

async function loadPostHog(): Promise<void> {
  try {
    const { default: posthog } = await import("posthog-js");
    initialize(posthog);
  } catch {
    // Offline or blocked: analytics is optional, so the app carries on without it.
    hasLoadFailed = true;
    pendingCaptures = [];
  }
}

/**
 * Applies this browser's consent before any event can be sent: only an accepted answer loads
 * posthog-js. Turning it off stops capture at once, forgets a Start practicing click and removes
 * the visitor ID from the browser, so re-enabling never brings either back.
 */
export function setAnalyticsEnabled(isEnabled: boolean): void {
  if (!isConfigured || isEnabled === shouldShareUsage) return;

  shouldShareUsage = isEnabled;
  if (!isEnabled) {
    isStartedFromPublicPage = false;
    // Events still waiting for posthog-js were sent while sharing was on, but never leave now.
    pendingCaptures = [];
    if (client !== undefined) forgetVisitor(client);
    return;
  }
  if (client !== undefined) {
    rememberVisitor(client);
    return;
  }
  if (hasStartedLoading) return;

  hasStartedLoading = true;
  void loadPostHog();
}

/**
 * Links analytics to the account by its id, never its email, while a signed-in user has linking
 * on and sharing is on. Turning linking off or signing out resets to a new random visitor ID.
 */
export function setAnalyticsAccount(nextAccount: Readonly<AnalyticsAccount>): void {
  account = nextAccount;
  if (nextAccount.status === "signedIn") {
    lastSignedInUserId = nextAccount.userId;
  }
  if (client !== undefined && shouldShareUsage) {
    applyAccountLink(client);
  }
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
  capture("$pageview", { $current_url: window.location.origin + pathname });
}

/** Sends only the listed product events when analytics is enabled. */
export function track<EventName extends keyof AnalyticsEvents>(
  event: EventName,
  ...args: AnalyticsEvents[EventName] extends undefined ? [] : [AnalyticsEvents[EventName]]
): void {
  if (!canCapture()) return;
  capture(event, args[0]);
}
