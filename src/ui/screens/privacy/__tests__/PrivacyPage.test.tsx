import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SETTINGS } from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";
import { readUsageSharing } from "@/storage/usageSharing";
import { anAttempt, aSaveFile } from "@/test/builders";

import { PrivacyPage } from "../PrivacyPage";

const OPTED_OUT_SAVE = aSaveFile({
  entries: [anAttempt()],
  settings: { ...DEFAULT_SETTINGS, shareAnonymousUsage: false },
});

function privacyElement() {
  return (
    <MemoryRouter>
      <PrivacyPage />
    </MemoryRouter>
  );
}

function usageSwitch(): HTMLElement {
  return screen.getByRole("switch", { name: "Share usage data" });
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("PrivacyPage", () => {
  it("puts the public-page analytics disclosure in the HTML, with the switch waiting", () => {
    const container = document.createElement("div");

    container.innerHTML = renderToString(privacyElement());

    expect(container.textContent).toContain("The same choice covers the public pages");
    expect(container.textContent).toContain("where on that page the button sits");
    expect(container.textContent).toContain("Nothing links these events to an account");
    expect(container.textContent).toContain("on every page, public and practice");
    expect(container.textContent).toContain("Your notes, key insights");
    expect(container.querySelector("[role=switch]")?.hasAttribute("disabled")).toBe(true);
  });

  it("enables the switch with the saved choice once hydrated", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(OPTED_OUT_SAVE));
    const container = document.createElement("div");
    container.innerHTML = renderToString(privacyElement());
    document.body.append(container);

    // The switch waits for the storage module, which useUsageSharing loads on demand.
    await act(async () => {
      hydrateRoot(container, privacyElement());
      await import("@/storage/usageSharing");
    });

    expect(usageSwitch()).toHaveProperty("disabled", false);
    expect(usageSwitch().getAttribute("aria-checked")).toBe("false");
  });

  // Settings reads this same saved setting; e2e/publicPages.spec.ts checks the two screens agree.
  it("saves turning sharing off into the browser setting Settings reads, keeping the log", async () => {
    const save = aSaveFile({ entries: [anAttempt()] });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
    render(privacyElement());

    await userEvent.click(usageSwitch());

    expect(readUsageSharing()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toContain(save.entries[0]?.id);
  });
});
