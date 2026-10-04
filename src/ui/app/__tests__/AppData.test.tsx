import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SETTINGS, type SaveFile } from "@/domain/types";
import { exportJson, STORAGE_KEY } from "@/storage/localStore";
import { readUsageSharing, setUsageSharing } from "@/storage/usageSharing";
import { anAttempt, aNewAttempt, aRemoteSave, aSaveFile } from "@/test/builders";
import { aFakeRemote } from "@/test/fakeRemoteStore";
import { aFakeSupabase } from "@/test/fakeSupabase";

import { AppDataProvider, useAppData, type AppDataValue } from "../AppData";
import { LOCAL_CHANGE_DEBOUNCE_MS } from "../syncEngine";

const UUID_PATTERN = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/;

function readStoredFile(): SaveFile {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as SaveFile; // safe: written by the provider
}

let latestAppData: AppDataValue | undefined;

// Hands the context value to the test so it can call the actions directly.
function AppDataProbe() {
  const appData = useAppData();
  useEffect(() => {
    latestAppData = appData;
  });
  return null;
}

function renderProvider(): () => AppDataValue {
  render(
    <AppDataProvider>
      <AppDataProbe />
    </AppDataProvider>,
  );
  return function currentAppData() {
    if (latestAppData === undefined) {
      throw new Error("the provider did not render its children");
    }
    return latestAppData;
  };
}

function TimerButtons() {
  const { file, startTimer, clearTimer } = useAppData();
  return (
    <>
      <p>{file.activeTimer?.problemId ?? "no timer"}</p>
      <button type="button" onClick={() => startTimer("two-sum")}>
        Start
      </button>
      <button type="button" onClick={clearTimer}>
        Clear
      </button>
    </>
  );
}

afterEach(() => {
  latestAppData = undefined;
  localStorage.clear();
  vi.useRealTimers();
});

describe("AppDataProvider", () => {
  it("saves an added attempt to localStorage under dsa-learning:v1", () => {
    const appData = renderProvider();

    act(() => {
      appData().addAttempt({
        problemId: "contains-duplicate",
        completedAt: "2026-10-01T12:00:00.000Z",
        date: "2026-10-01",
        rating: "hard",
        timeMinutes: 20,
        help: "none",
      });
    });

    const stored = readStoredFile();
    expect(stored.entries).toHaveLength(1);
    expect(stored.entries[0]?.id).toMatch(UUID_PATTERN);
    expect(stored.entries[0]).toMatchObject({ type: "attempt", rating: "hard" });
  });

  it("loads the saved file on mount and derives each problem's state from it", () => {
    const saved: SaveFile = {
      version: 1,
      entries: [
        {
          type: "markedMastered",
          id: "mark-1",
          problemId: "contains-duplicate",
          at: "2026-10-01T12:00:00.000Z",
          date: "2026-10-01",
        },
      ],
      settings: {
        timeBoxMinutes: { Easy: 10, Medium: 20, Hard: 30 },
        showPatternOnReviews: true,
        shareAnonymousUsage: true,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));

    const appData = renderProvider();

    expect(appData().file).toEqual(saved);
    expect(appData().states["contains-duplicate"]).toEqual({
      status: "mastered",
      since: "2026-10-01",
    });
    expect(appData().states["valid-anagram"]).toEqual({ status: "new" });
  });

  it("marks a deleted entry instead of removing it, so the problem is new again", () => {
    const appData = renderProvider();
    act(() => {
      appData().markMastered("contains-duplicate");
    });
    const markId = readStoredFile().entries[0]?.id ?? "";

    act(() => {
      appData().deleteEntry(markId);
    });

    expect(readStoredFile().entries[0]?.deletedAt).toBeDefined();
    expect(appData().states["contains-duplicate"]).toEqual({ status: "new" });
  });

  it("returns the import result and saves the merged file", () => {
    const appData = renderProvider();
    const exported = JSON.stringify({
      version: 1,
      entries: [
        {
          type: "markedMastered",
          id: "mark-1",
          problemId: "two-sum",
          at: "2026-10-01T12:00:00.000Z",
          date: "2026-10-01",
        },
      ],
      settings: {
        timeBoxMinutes: { Easy: 15, Medium: 30, Hard: 45 },
        showPatternOnReviews: false,
        shareAnonymousUsage: true,
      },
    });

    let result: ReturnType<AppDataValue["importText"]> | undefined;
    act(() => {
      result = appData().importText(exported);
    });

    expect(result).toMatchObject({ ok: true, added: 1 });
    expect(readStoredFile().entries).toHaveLength(1);
  });

  it("recomputes today's date when the window regains focus", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 1, 23, 59));
    const appData = renderProvider();
    expect(appData().todayDate).toBe("2026-10-01");

    vi.setSystemTime(new Date(2026, 9, 2, 0, 1));
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(appData().todayDate).toBe("2026-10-02");
  });

  it("throws when used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => render(<AppDataProbe />)).toThrow(
      "useAppData must be used inside AppDataProvider",
    );
  });
});

describe("AppDataProvider with a timer", () => {
  it("starts and clears the timer", async () => {
    const user = userEvent.setup();
    render(
      <AppDataProvider>
        <TimerButtons />
      </AppDataProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Start" }));
    expect(readStoredFile().activeTimer?.problemId).toBe("two-sum");
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(screen.getByText("no timer")).toBeDefined();
    expect(readStoredFile()).not.toHaveProperty("activeTimer");
  });
});

const OPTED_OUT_SETTINGS = { ...DEFAULT_SETTINGS, shareAnonymousUsage: false };

function storeFile(file: SaveFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
}

describe("AppDataProvider and the usage-sharing choice", () => {
  it("keeps an opt-out through ordinary saves", () => {
    storeFile(aSaveFile({ settings: OPTED_OUT_SETTINGS }));
    const appData = renderProvider();

    act(() => {
      appData().addAttempt(aNewAttempt());
      appData().startTimer("two-sum");
    });

    expect(readStoredFile().settings.shareAnonymousUsage).toBe(false);
    expect(readUsageSharing()).toBe(false);
  });

  it("never saves its older copy of the choice over a newer one", () => {
    const appData = renderProvider();
    // Another page changed the save without this document hearing about it.
    storeFile(aSaveFile({ settings: OPTED_OUT_SETTINGS }));

    act(() => {
      appData().addAttempt(aNewAttempt());
    });

    expect(readStoredFile().settings.shareAnonymousUsage).toBe(false);
    expect(readStoredFile().entries).toHaveLength(1);
  });

  it("picks up a choice made outside it without saving its own copy", () => {
    const appData = renderProvider();

    act(() => {
      setUsageSharing(false);
    });

    expect(appData().file.settings.shareAnonymousUsage).toBe(false);
    expect(readStoredFile()).toEqual(aSaveFile({ settings: OPTED_OUT_SETTINGS }));
  });

  it("picks up another tab's choice from a storage event without saving over that tab", () => {
    const appData = renderProvider();
    const otherTabSave = aSaveFile({ entries: [anAttempt()], settings: OPTED_OUT_SETTINGS });
    storeFile(otherTabSave);

    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    });

    expect(appData().file.settings.shareAnonymousUsage).toBe(false);
    expect(readStoredFile()).toEqual(otherTabSave);
  });

  it("saves its own change of the choice where the bridge reads it", () => {
    const appData = renderProvider();

    act(() => {
      appData().updateSettings({ shareAnonymousUsage: false });
    });

    expect(readUsageSharing()).toBe(false);
    expect(appData().file.settings.shareAnonymousUsage).toBe(false);
  });

  it("adopts the imported choice when the log is empty", () => {
    const appData = renderProvider();
    const exported = exportJson(
      aSaveFile({ entries: [anAttempt()], settings: OPTED_OUT_SETTINGS }),
    );

    act(() => {
      appData().importText(exported);
    });

    expect(readUsageSharing()).toBe(false);
    expect(appData().file.settings.shareAnonymousUsage).toBe(false);
  });

  it("keeps the current choice when importing into a log that has entries", () => {
    storeFile(aSaveFile({ entries: [anAttempt()] }));
    const appData = renderProvider();
    const exported = exportJson(
      aSaveFile({ entries: [anAttempt({ id: "imported" })], settings: OPTED_OUT_SETTINGS }),
    );

    act(() => {
      appData().importText(exported);
    });

    expect(readUsageSharing()).toBe(true);
    expect(readStoredFile().entries).toHaveLength(2);
  });

  it("adopts the account's choice when a first sync takes the account's settings", async () => {
    const remote = aFakeRemote(aRemoteSave({ settings: OPTED_OUT_SETTINGS }));
    render(
      <AppDataProvider
        accountService={aFakeSupabase({ email: "ada@example.com" }).accountService}
        remoteStore={remote.remoteStore}
      >
        <AppDataProbe />
      </AppDataProvider>,
    );

    await vi.waitFor(() => {
      expect(readUsageSharing()).toBe(false);
    });
    expect(latestAppData?.file.settings.shareAnonymousUsage).toBe(false);
  });

  it("syncs a choice made outside it up to the account", async () => {
    const remote = aFakeRemote(aRemoteSave());
    render(
      <AppDataProvider
        accountService={aFakeSupabase({ email: "ada@example.com" }).accountService}
        remoteStore={remote.remoteStore}
      >
        <AppDataProbe />
      </AppDataProvider>,
    );
    await vi.waitFor(() => {
      expect(latestAppData?.syncStatus.status).toBe("synced");
    });

    act(() => {
      setUsageSharing(false);
    });

    await vi.waitFor(
      () => {
        expect(remote.row).toMatchObject({ settings: { shareAnonymousUsage: false } });
      },
      { timeout: LOCAL_CHANGE_DEBOUNCE_MS * 2 },
    );
  });
});
