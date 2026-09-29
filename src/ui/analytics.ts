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
const posthogHost = typeof configuredHost === "string" && configuredHost !== ""
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
  if (!isInitialized) {
    posthog.init(projectKey, {
      api_host: posthogHost,
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      person_profiles: "never",
      opt_out_capturing_by_default: !isEnabled,
    });
    isInitialized = true;
  }

  if (!isEnabled) {
    posthog.opt_out_capturing();
    return;
  }
  posthog.opt_in_capturing();
  if (!hasTrackedOpening) {
    hasTrackedOpening = true;
    track("app_opened");
  }
}

/** Sends only the listed anonymous product events when analytics is enabled. */
export function track<EventName extends keyof AnalyticsEvents>(
  event: EventName,
  ...args: AnalyticsEvents[EventName] extends undefined ? [] : [AnalyticsEvents[EventName]]
): void {
  if (!isConfigured || !isInitialized || !shouldShareUsage) return;
  posthog.capture(event, args[0]);
}
