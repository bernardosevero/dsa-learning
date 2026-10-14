import { z } from "zod";

/** This browser's answer to the analytics question. Nothing is sent unless it is "accepted". */
export type UsageConsent = "unanswered" | "accepted" | "declined";

/** An answer the visitor gave: the banner, Settings and the Privacy page only set one of these. */
export type UsageAnswer = Exclude<UsageConsent, "unanswered">;

/** Its own key, outside the save file, so export, import and sync never carry the answer. */
export const USAGE_CONSENT_KEY = "dsa-learning:usage-consent";

const usageAnswerSchema = z.enum(["accepted", "declined"]);

type UsageConsentListener = (consent: UsageConsent) => void;

const listeners = new Set<UsageConsentListener>();
// Holds the answer only while storage refuses it, so this document still keeps to the choice.
let unpersistedAnswer: UsageAnswer | undefined;

function readStoredText(): string | null {
  try {
    return window.localStorage.getItem(USAGE_CONSENT_KEY);
  } catch {
    // No window (tests, server) or storage blocked by the browser.
    return null;
  }
}

function writeStoredText(answer: UsageAnswer): boolean {
  try {
    window.localStorage.setItem(USAGE_CONSENT_KEY, answer);
    return true;
  } catch {
    return false;
  }
}

/** Returns this browser's answer, or "unanswered" when none is saved or it can't be read. */
export function readUsageConsent(): UsageConsent {
  if (unpersistedAnswer !== undefined) {
    return unpersistedAnswer;
  }
  const parsed = usageAnswerSchema.safeParse(readStoredText());
  return parsed.success ? parsed.data : "unanswered";
}

/** Saves this browser's answer and tells this document's subscribers when it changed. */
export function setUsageConsent(answer: UsageAnswer): void {
  if (readUsageConsent() === answer) {
    return;
  }
  unpersistedAnswer = writeStoredText(answer) ? undefined : answer;
  for (const listener of listeners) {
    listener(answer);
  }
}

/**
 * Calls `listener` with the answer when this document changes it, or when another tab changes it
 * or clears storage. Returns the function that stops listening. Browser only.
 */
export function subscribeUsageConsent(listener: UsageConsentListener): () => void {
  // A null key means another tab cleared the whole storage.
  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === USAGE_CONSENT_KEY) {
      listener(readUsageConsent());
    }
  }

  listeners.add(listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}
