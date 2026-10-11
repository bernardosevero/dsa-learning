import { act, render, screen, within } from "@testing-library/react";
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

  it("keeps every disclosure while leading with where the data lives", () => {
    render(privacyElement());

    const page = document.body.textContent;

    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
      "Your practice log lives in your browser.",
    );
    expect(
      screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(["This browser", "Your account", "Usage analytics"]);
    for (const disclosure of [
      "Without an account there is no server copy of your practice log",
      "your email address, your GitHub name and avatar",
      "East US (North Virginia)",
      "Delete account in Settings removes your account and that copy",
      "the IP address of each network request",
      "a visitor hash that changes daily",
      "does not put analytics cookies or a persistent visitor ID",
      "Nothing links these events to an account",
      "it does not delete events already sent",
      "under its MIT license",
      "not affiliated with or endorsed by NeetCode or LeetCode",
    ]) {
      expect(page, disclosure).toContain(disclosure);
    }
  });

  it("names each event sharing sends, and what is never sent", () => {
    render(privacyElement());

    const sent = within(screen.getByRole("region", { name: "What sharing sends" }));
    const [events, neverSent] = sent.getAllByRole("list");
    if (events === undefined || neverSent === undefined) {
      throw new Error("Expected the events list and the never-sent list");
    }

    expect(
      within(events)
        .getAllByRole("listitem")
        .map((item) => item.firstElementChild?.textContent),
    ).toEqual([
      "Page viewed",
      "App opened",
      "Attempt logged",
      "Marked already mastered",
      "Data exported",
      "Data imported",
      "Start practicing clicked",
    ]);
    expect(
      within(neverSent)
        .getAllByRole("listitem")
        .map((item) => item.textContent),
    ).toEqual(["Your notes", "Key insights", "Problem solutions", "Exported file contents"]);
    expect(sent.getByText("Never sent")).toBeDefined();
  });

  it("links the analytics card to the switch, which shows its state in words", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(OPTED_OUT_SAVE));
    render(privacyElement());

    expect(screen.getByRole("link", { name: "Turn it off" }).getAttribute("href")).toBe(
      "#usage-sharing",
    );
    expect(
      within(screen.getByRole("region", { name: "Share anonymous usage" })).getByRole("switch", {
        name: "Share usage data",
      }),
    ).toBeDefined();
    expect(await screen.findByText("Off")).toBeDefined();
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
