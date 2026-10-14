import { useState, useSyncExternalStore } from "react";

import type { UsageAnswer, UsageConsent } from "@/storage/usageConsent";

import { setAnalyticsEnabled } from "./analytics";

export interface UsageConsentState {
  /** The saved answer, or undefined on the server and in the first browser render. */
  readonly consent: UsageConsent | undefined;
  readonly setConsent: (answer: UsageAnswer) => void;
}

interface UsageConsentSource {
  getSnapshot: () => UsageConsent | undefined;
  subscribe: (onChange: () => void) => () => void;
}

// Loaded on demand: the storage module carries zod, which public pages would otherwise download
// before their first paint.
function loadUsageConsentStorage() {
  return import("@/storage/usageConsent");
}

// Analytics follows at once, so a Decline stops events before the answer has even been saved.
function answerUsageConsent(answer: UsageAnswer): void {
  setAnalyticsEnabled(answer === "accepted");
  void loadUsageConsentStorage().then((storage) => {
    storage.setUsageConsent(answer);
  });
}

// Storage is read only once React subscribes, after the first render has committed, so the
// server and the first browser render both see undefined.
function createUsageConsentSource(): UsageConsentSource {
  let consent: UsageConsent | undefined;
  return {
    getSnapshot: () => consent,
    subscribe(onChange) {
      let isSubscribed = true;
      let unsubscribe: (() => void) | undefined;
      void loadUsageConsentStorage().then((storage) => {
        if (!isSubscribed) {
          return;
        }
        unsubscribe = storage.subscribeUsageConsent((latestConsent) => {
          consent = latestConsent;
          onChange();
        });
        consent = storage.readUsageConsent();
        onChange();
      });
      return () => {
        isSubscribed = false;
        unsubscribe?.();
      };
    },
  };
}

/**
 * Returns this browser's analytics answer and its setter, on public and practice pages alike. The
 * answer is undefined on the server and in the first browser render, until storage has been read.
 */
export function useUsageConsent(): UsageConsentState {
  const [source] = useState(createUsageConsentSource);
  const consent = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
  return { consent, setConsent: answerUsageConsent };
}
