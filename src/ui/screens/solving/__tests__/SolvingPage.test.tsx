import { act, render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_SAVE_FILE, type Attempt, type SaveFile } from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";
import { AppDataProvider } from "@/ui/app/AppData";

import { SolvingPage } from "../SolvingPage";

const NOW = new Date(2026, 9, 10, 10, 0);
const TWO_MINUTES = 2 * 60_000;
const DEFAULT_TIME_MINUTES = 20;

function anAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    type: "attempt",
    id: "attempt-1",
    problemId: "contains-duplicate",
    completedAt: "2026-10-01T12:00:00.000Z",
    date: "2026-10-01",
    rating: "hard",
    timeMinutes: DEFAULT_TIME_MINUTES,
    help: "none",
    ...overrides,
  };
}

function aSaveFile(overrides: Partial<SaveFile> = {}): SaveFile {
  return { ...EMPTY_SAVE_FILE, ...overrides };
}

function readStoredFile(): SaveFile {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as SaveFile; // safe: written by the provider
}

function LocationProbe() {
  const location = useLocation();
  return <p>At {location.pathname + location.search}</p>;
}

function renderSolving(problemId: string, file: SaveFile = aSaveFile()) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
  return render(
    <AppDataProvider>
      <MemoryRouter initialEntries={[`/solve/${problemId}`]}>
        <Routes>
          <Route path="solve/:problemId" element={<SolvingPage />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date", "setInterval", "clearInterval"], now: NOW });
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("SolvingPage", () => {
  it("hides the pattern on a review", () => {
    renderSolving("contains-duplicate", aSaveFile({ entries: [anAttempt()] }));

    expect(screen.getByText("Review · pattern hidden")).toBeDefined();
    expect(screen.getByText("Easy · last solved Oct 1")).toBeDefined();
    expect(screen.queryByText(/Arrays & Hashing/)).toBeNull();
    expect(screen.getByText(/They reveal the pattern/)).toBeDefined();
  });

  it("shows the pattern on a review when the user opted in", () => {
    const settings = { ...EMPTY_SAVE_FILE.settings, showPatternOnReviews: true };

    renderSolving("contains-duplicate", aSaveFile({ entries: [anAttempt()], settings }));

    expect(screen.getByText("Review")).toBeDefined();
    expect(screen.queryByText("Review · pattern hidden")).toBeNull();
    expect(screen.getByText("Arrays & Hashing · Easy · last solved Oct 1")).toBeDefined();
  });

  it("shows the pattern on a new problem", () => {
    renderSolving("two-sum");

    expect(screen.getByText("New problem")).toBeDefined();
    expect(screen.getByText(/Time box for an Easy problem/)).toBeDefined();
    expect(screen.getByText("Arrays & Hashing · Easy")).toBeDefined();
    expect(screen.queryByText(/They reveal the pattern/)).toBeNull();
  });

  it("starts the timer on arrival and keeps it across a remount", () => {
    const firstVisit = renderSolving("two-sum");
    act(() => {
      vi.advanceTimersByTime(TWO_MINUTES);
    });
    firstVisit.unmount();

    render(
      <AppDataProvider>
        <MemoryRouter initialEntries={["/solve/two-sum"]}>
          <Routes>
            <Route path="solve/:problemId" element={<SolvingPage />} />
          </Routes>
        </MemoryRouter>
      </AppDataProvider>,
    );

    expect(screen.getByText("02:00")).toBeDefined();
    expect(readStoredFile().activeTimer).toEqual({
      problemId: "two-sum",
      startedAt: NOW.toISOString(),
    });
  });

  it("says how far past the time box the attempt is, without stopping", () => {
    const twentyMinutesAgo = new Date(NOW.getTime() - 20 * 60_000).toISOString();

    renderSolving(
      "two-sum",
      aSaveFile({ activeTimer: { problemId: "two-sum", startedAt: twentyMinutesAgo } }),
    );

    expect(screen.getByText("20:00")).toBeDefined();
    expect(screen.getByText(/5 min past the time box/)).toBeDefined();
  });

  it("clears the timer and goes back to Today on Cancel", async () => {
    const user = userEvent.setup();
    renderSolving("two-sum");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("At /")).toBeDefined();
    expect(readStoredFile()).not.toHaveProperty("activeTimer");
  });

  it("goes to Log with the solution as help when the user looked at it", async () => {
    const user = userEvent.setup();
    renderSolving("two-sum");

    await user.click(screen.getByRole("link", { name: "I looked at the solution" }));

    expect(screen.getByText("At /log/two-sum?help=solution")).toBeDefined();
  });

  it("asks before replacing another problem's running timer", async () => {
    const user = userEvent.setup();
    const running = { problemId: "valid-anagram", startedAt: NOW.toISOString() };
    renderSolving("two-sum", aSaveFile({ activeTimer: running }));
    expect(readStoredFile().activeTimer).toEqual(running);

    await user.click(screen.getByRole("button", { name: "Replace it" }));

    expect(readStoredFile().activeTimer?.problemId).toBe("two-sum");
  });
});
