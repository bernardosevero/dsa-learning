import { act, render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_SAVE_FILE, type SaveFile } from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";
import { anAttempt, aSaveFile } from "@/test/builders";
import { AppDataProvider } from "@/ui/app/AppData";

import { SolvingPage } from "../SolvingPage";

const NOW = new Date(2026, 9, 10, 10, 0);
const TWO_MINUTES = 2 * 60_000;
const TWELVE_MINUTES = 12 * 60_000;

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
    renderSolving("contains-duplicate", aSaveFile({ entries: [anAttempt({ rating: "hard" })] }));

    expect(screen.getByText("Review · pattern hidden")).toBeDefined();
    expect(screen.getByText("Easy · last solved Oct 1")).toBeDefined();
    expect(screen.queryByText(/Arrays & Hashing/)).toBeNull();
    expect(screen.getByText(/They reveal the pattern/)).toBeDefined();
  });

  it("shows the pattern on a review when the user opted in", () => {
    const settings = { ...EMPTY_SAVE_FILE.settings, showPatternOnReviews: true };

    renderSolving(
      "contains-duplicate",
      aSaveFile({ entries: [anAttempt({ rating: "hard" })], settings }),
    );

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

  it("restarts the timer from 00:00 once the user confirms", async () => {
    const user = userEvent.setup();
    renderSolving("two-sum");
    act(() => {
      vi.advanceTimersByTime(TWELVE_MINUTES);
    });

    await user.click(screen.getByRole("button", { name: "Restart" }));
    const question = screen.getByRole("group", { name: /Restart from 00:00\?/ });
    await user.click(within(question).getByRole("button", { name: "Restart" }));

    expect(screen.getByText("00:00")).toBeDefined();
    expect(screen.queryByRole("group", { name: /Restart from 00:00\?/ })).toBeNull();
    expect(readStoredFile().activeTimer).toEqual({
      problemId: "two-sum",
      startedAt: new Date(NOW.getTime() + TWELVE_MINUTES).toISOString(),
    });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Restart" }));
  });

  it("keeps the time as it was when the user answers Keep", async () => {
    const user = userEvent.setup();
    renderSolving("two-sum");
    act(() => {
      vi.advanceTimersByTime(TWELVE_MINUTES);
    });

    await user.click(screen.getByRole("button", { name: "Restart" }));
    const question = screen.getByRole("group", { name: /Restart from 00:00\?/ });
    expect(within(question).getByText(/The 12:00 so far is dropped/)).toBeDefined();
    await user.click(within(question).getByRole("button", { name: "Keep" }));

    expect(screen.getByText("12:00")).toBeDefined();
    expect(screen.queryByRole("group", { name: /Restart from 00:00\?/ })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Restart" }));
  });

  it("moves focus to the restart question and treats Escape as Keep", async () => {
    const user = userEvent.setup();
    renderSolving("two-sum");
    act(() => {
      vi.advanceTimersByTime(TWELVE_MINUTES);
    });

    screen.getByRole("button", { name: "Restart" }).focus();
    await user.keyboard("{Enter}");
    const question = screen.getByRole("group", { name: /Restart from 00:00\?/ });
    expect(question.contains(document.activeElement)).toBe(true);
    await user.keyboard("{Escape}");

    expect(screen.getByText("12:00")).toBeDefined();
    expect(screen.queryByRole("group", { name: /Restart from 00:00\?/ })).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Restart" }));
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
