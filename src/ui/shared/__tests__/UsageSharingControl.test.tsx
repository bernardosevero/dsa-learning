import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { STORAGE_KEY } from "@/storage/localStore";
import { readUsageConsent, USAGE_CONSENT_KEY } from "@/storage/usageConsent";
import { anAttempt, aSaveFile } from "@/test/builders";

import { setAnalyticsEnabled } from "../analytics";
import { UsageSharingControl } from "../UsageSharingControl";
import { useUsageConsent } from "../useUsageConsent";

vi.mock("../analytics", () => ({ setAnalyticsEnabled: vi.fn() }));

// What a public page renders: the hook feeding the shared control, with no AppData around it.
function PublicUsageSharing() {
  const { consent, setConsent } = useUsageConsent();
  return <UsageSharingControl consent={consent} onConsentChange={setConsent} />;
}

function usageSwitch(): HTMLElement {
  return screen.getByRole("switch", { name: "Share usage data" });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("UsageSharingControl", () => {
  it("waits, disabled, while the answer is unknown", () => {
    render(<UsageSharingControl consent={undefined} onConsentChange={vi.fn()} />);

    expect(usageSwitch()).toHaveProperty("disabled", true);
  });

  it("stays off before the visitor answers, and turning it on accepts", async () => {
    const handleConsentChange = vi.fn();
    render(<UsageSharingControl consent="unanswered" onConsentChange={handleConsentChange} />);

    await userEvent.click(usageSwitch());

    expect(usageSwitch().getAttribute("aria-checked")).toBe("false");
    expect(handleConsentChange).toHaveBeenCalledWith("accepted");
  });

  it("shows an accepted answer as on, and turning it off declines", async () => {
    const handleConsentChange = vi.fn();
    render(<UsageSharingControl consent="accepted" onConsentChange={handleConsentChange} />);

    await userEvent.click(usageSwitch());

    expect(usageSwitch().getAttribute("aria-checked")).toBe("true");
    expect(handleConsentChange).toHaveBeenCalledWith("declined");
  });
});

describe("useUsageConsent", () => {
  it("prerenders and hydrates without touching storage, then shows the saved answer", async () => {
    localStorage.setItem(USAGE_CONSENT_KEY, "accepted");
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    const html = renderToString(<PublicUsageSharing />);

    expect(getItem).not.toHaveBeenCalled();
    expect(html).toContain("disabled");

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const handleRecoverableError = vi.fn();
    await act(async () => {
      hydrateRoot(container, <PublicUsageSharing />, {
        onRecoverableError: handleRecoverableError,
      });
      await import("@/storage/usageConsent");
    });

    expect(handleRecoverableError).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(usageSwitch()).toHaveProperty("disabled", false);
    expect(usageSwitch().getAttribute("aria-checked")).toBe("true");
  });

  it("saves an answer under its own key and stops analytics at once on a Decline", async () => {
    const save = JSON.stringify(aSaveFile({ entries: [anAttempt()] }));
    localStorage.setItem(STORAGE_KEY, save);
    localStorage.setItem(USAGE_CONSENT_KEY, "accepted");
    render(<PublicUsageSharing />);
    await vi.waitFor(() => {
      expect(usageSwitch()).toHaveProperty("disabled", false);
    });

    await userEvent.click(usageSwitch());

    expect(setAnalyticsEnabled).toHaveBeenCalledExactlyOnceWith(false);
    expect(readUsageConsent()).toBe("declined");
    expect(usageSwitch().getAttribute("aria-checked")).toBe("false");
    expect(localStorage.getItem(STORAGE_KEY)).toBe(save);
  });

  it("follows an answer given in another tab", async () => {
    render(<PublicUsageSharing />);
    await vi.waitFor(() => {
      expect(usageSwitch()).toHaveProperty("disabled", false);
    });
    localStorage.setItem(USAGE_CONSENT_KEY, "accepted");

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: USAGE_CONSENT_KEY }));
    });

    expect(usageSwitch().getAttribute("aria-checked")).toBe("true");
  });
});
