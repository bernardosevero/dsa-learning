// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import { aSaveFile } from "@/test/builders";

import { STORAGE_KEY } from "../localStore";
import {
  readUsageConsent,
  setUsageConsent,
  subscribeUsageConsent,
  USAGE_CONSENT_KEY,
} from "../usageConsent";

function dispatchStorageEvent(key: string | null): void {
  window.dispatchEvent(new StorageEvent("storage", { key }));
}

afterEach(() => {
  localStorage.clear();
});

describe("readUsageConsent", () => {
  it("returns unanswered when nothing is saved, without saving anything", () => {
    expect(readUsageConsent()).toBe("unanswered");

    expect(localStorage.length).toBe(0);
  });

  it("returns the saved answer", () => {
    localStorage.setItem(USAGE_CONSENT_KEY, "declined");

    expect(readUsageConsent()).toBe("declined");
  });

  it("reads an unknown saved value as unanswered", () => {
    localStorage.setItem(USAGE_CONSENT_KEY, "maybe");

    expect(readUsageConsent()).toBe("unanswered");
  });

  it("ignores the old opt-out switch in the save file", () => {
    const settings = { ...aSaveFile().settings, shareAnonymousUsage: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(aSaveFile({ settings })));

    expect(readUsageConsent()).toBe("unanswered");
  });
});

describe("setUsageConsent", () => {
  it("saves the answer under its own key and leaves the practice save alone", () => {
    const save = JSON.stringify(aSaveFile());
    localStorage.setItem(STORAGE_KEY, save);

    setUsageConsent("accepted");

    expect(localStorage.getItem(USAGE_CONSENT_KEY)).toBe("accepted");
    expect(localStorage.getItem(STORAGE_KEY)).toBe(save);
  });

  it("tells subscribers in this document only when the answer changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUsageConsent(listener);

    setUsageConsent("declined");
    setUsageConsent("declined");
    setUsageConsent("accepted");
    unsubscribe();

    expect(listener.mock.calls).toEqual([["declined"], ["accepted"]]);
  });
});

describe("subscribeUsageConsent", () => {
  it("rereads the answer when another tab changes it or clears storage", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUsageConsent(listener);

    localStorage.setItem(USAGE_CONSENT_KEY, "accepted");
    dispatchStorageEvent(USAGE_CONSENT_KEY);
    localStorage.clear();
    dispatchStorageEvent(null);
    unsubscribe();

    expect(listener.mock.calls).toEqual([["accepted"], ["unanswered"]]);
  });

  it("ignores storage events for other keys", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUsageConsent(listener);

    dispatchStorageEvent(STORAGE_KEY);
    unsubscribe();

    expect(listener).not.toHaveBeenCalled();
  });

  it("stops listening to both kinds of change once unsubscribed", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeUsageConsent(listener);

    unsubscribe();
    setUsageConsent("accepted");
    dispatchStorageEvent(USAGE_CONSENT_KEY);

    expect(listener).not.toHaveBeenCalled();
  });
});

describe("with localStorage blocked", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("keeps the answer in memory for the rest of this document", async () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });
    vi.resetModules();
    const usageConsent = await import("../usageConsent");

    usageConsent.setUsageConsent("declined");

    expect(usageConsent.readUsageConsent()).toBe("declined");
    vi.restoreAllMocks();
    expect(localStorage.getItem(USAGE_CONSENT_KEY)).toBeNull();
  });
});
