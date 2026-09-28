import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SaveFile } from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";

import { AppDataProvider, useAppData, type AppDataValue } from "../AppData";

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
  it("saves an added attempt to localStorage under dta-learning:v1", () => {
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
      settings: { timeBoxMinutes: { Easy: 10, Medium: 20, Hard: 30 }, showPatternOnReviews: true },
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
      settings: { timeBoxMinutes: { Easy: 15, Medium: 30, Hard: 45 }, showPatternOnReviews: false },
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
