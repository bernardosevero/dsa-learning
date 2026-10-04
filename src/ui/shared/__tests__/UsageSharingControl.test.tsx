import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SETTINGS, type SaveFile } from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";
import { readUsageSharing } from "@/storage/usageSharing";
import { anAttempt, aSaveFile } from "@/test/builders";

import { UsageSharingControl } from "../UsageSharingControl";
import { useUsageSharing } from "../useUsageSharing";

const OPTED_OUT_SAVE = aSaveFile({
  entries: [anAttempt()],
  settings: { ...DEFAULT_SETTINGS, shareAnonymousUsage: false },
});

// What a public page renders: the hook feeding the shared control, with no AppData around it.
function PublicUsageSharing() {
  const { isEnabled, setEnabled } = useUsageSharing();
  return <UsageSharingControl isEnabled={isEnabled} onEnabledChange={setEnabled} />;
}

function storeFile(file: SaveFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
}

function usageSwitch(): HTMLElement {
  return screen.getByRole("switch", { name: "Share usage data" });
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  document.body.innerHTML = "";
});

describe("UsageSharingControl", () => {
  it("waits, disabled, while the choice is unknown", () => {
    render(<UsageSharingControl isEnabled={undefined} onEnabledChange={vi.fn()} />);

    expect(usageSwitch()).toHaveProperty("disabled", true);
  });

  it("shows the choice and reports a change", async () => {
    const handleEnabledChange = vi.fn();
    render(<UsageSharingControl isEnabled onEnabledChange={handleEnabledChange} />);

    await userEvent.click(usageSwitch());

    expect(usageSwitch().getAttribute("aria-checked")).toBe("true");
    expect(handleEnabledChange).toHaveBeenCalledWith(false);
  });
});

describe("useUsageSharing", () => {
  it("prerenders and hydrates without touching storage, then shows the saved choice", () => {
    storeFile(OPTED_OUT_SAVE);
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const setItem = vi.spyOn(Storage.prototype, "setItem");

    const html = renderToString(<PublicUsageSharing />);

    expect(getItem).not.toHaveBeenCalled();
    expect(html).toContain("disabled");

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.append(container);
    const handleRecoverableError = vi.fn();
    act(() => {
      hydrateRoot(container, <PublicUsageSharing />, {
        onRecoverableError: handleRecoverableError,
      });
    });

    expect(handleRecoverableError).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(usageSwitch()).toHaveProperty("disabled", false);
    expect(usageSwitch().getAttribute("aria-checked")).toBe("false");
  });

  it("saves a change into the existing save, keeping its entries", async () => {
    storeFile(OPTED_OUT_SAVE);
    render(<PublicUsageSharing />);

    await userEvent.click(usageSwitch());

    expect(readUsageSharing()).toBe(true);
    expect(usageSwitch().getAttribute("aria-checked")).toBe("true");
    expect(localStorage.getItem(STORAGE_KEY)).toContain(OPTED_OUT_SAVE.entries[0]?.id);
  });

  it("follows a change made by another tab", () => {
    render(<PublicUsageSharing />);
    storeFile(OPTED_OUT_SAVE);

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    });

    expect(usageSwitch().getAttribute("aria-checked")).toBe("false");
  });
});
