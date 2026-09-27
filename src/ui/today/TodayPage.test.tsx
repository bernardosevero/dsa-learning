import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PROBLEMS } from "@/data/problems";
import {
  EMPTY_SAVE_FILE,
  type Attempt,
  type Entry,
  type MarkedMastered,
  type SaveFile,
} from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";
import { AppDataProvider } from "@/ui/AppData";

import { TodayPage } from "./TodayPage";

const DEFAULT_TIME_MINUTES = 20;

function anAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    type: "attempt",
    id: `attempt-${overrides.problemId ?? "contains-duplicate"}`,
    problemId: "contains-duplicate",
    completedAt: "2026-10-01T12:00:00.000Z",
    date: "2026-10-01",
    rating: "medium",
    timeMinutes: DEFAULT_TIME_MINUTES,
    help: "none",
    ...overrides,
  };
}

function aMasteredMark(problemId: string): MarkedMastered {
  return {
    type: "markedMastered",
    id: `mark-${problemId}`,
    problemId,
    at: "2026-09-01T12:00:00.000Z",
    date: "2026-09-01",
  };
}

function aSaveFile(overrides: Partial<SaveFile> = {}): SaveFile {
  return { ...EMPTY_SAVE_FILE, ...overrides };
}

function allMasteredExcept(problemId: string): Entry[] {
  return PROBLEMS.filter((problem) => problem.id !== problemId).map((problem) =>
    aMasteredMark(problem.id),
  );
}

// Today is 2026-10-10: contains-duplicate is 7 days overdue (Hard), valid-anagram 2 (Medium).
const TWO_DUE_REVIEWS = [
  anAttempt({ problemId: "contains-duplicate", rating: "hard" }),
  anAttempt({ problemId: "valid-anagram", rating: "medium" }),
];

function SolveProbe() {
  const { problemId } = useParams();
  return <p>Solving {problemId}</p>;
}

function renderToday(file: SaveFile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
  render(
    <AppDataProvider>
      <MemoryRouter>
        <Routes>
          <Route index element={<TodayPage />} />
          <Route path="solve/:problemId" element={<SolveProbe />} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 10, 10, 0) });
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("TodayPage", () => {
  it("lists the due reviews with only the first as the ★ focus, without their pattern", () => {
    renderToday(aSaveFile({ entries: TWO_DUE_REVIEWS }));

    const dueReviews = within(screen.getByRole("region", { name: /Due reviews/ }));
    expect(dueReviews.getByText("Contains Duplicate", { selector: "p" })).toBeDefined();
    expect(dueReviews.getByText("Valid Anagram", { selector: "p" })).toBeDefined();
    expect(dueReviews.getAllByText(/★/)).toHaveLength(1);
    expect(dueReviews.getByText("Easy · 7 days overdue")).toBeDefined();
    expect(dueReviews.queryByText(/Arrays & Hashing/)).toBeNull();
  });

  it("shows the next new problem with its pattern after the reviews", () => {
    renderToday(aSaveFile({ entries: TWO_DUE_REVIEWS }));

    const newSection = within(screen.getByRole("region", { name: /New/ }));
    expect(newSection.getByText("Two Sum", { selector: "p" })).toBeDefined();
    expect(newSection.getByText("Arrays & Hashing · Easy")).toBeDefined();
  });

  it("shows the pattern on review rows when the user opted in", () => {
    const settings = { ...EMPTY_SAVE_FILE.settings, showPatternOnReviews: true };

    renderToday(aSaveFile({ entries: TWO_DUE_REVIEWS, settings }));

    const dueReviews = within(screen.getByRole("region", { name: /Due reviews/ }));
    expect(dueReviews.getByText("Arrays & Hashing · Easy · 7 days overdue")).toBeDefined();
  });

  it("says all caught up with the next review date when nothing is due or new", () => {
    const scheduled = anAttempt({ problemId: "two-sum", date: "2026-10-08" });

    renderToday(aSaveFile({ entries: [...allMasteredExcept("two-sum"), scheduled] }));

    expect(screen.getByText(/All caught up · next review/).textContent).toBe(
      "All caught up · next review Thu, Oct 15",
    );
    expect(screen.queryByRole("region", { name: /Due reviews/ })).toBeNull();
  });

  it("says everything mastered when nothing is scheduled any more", () => {
    renderToday(aSaveFile({ entries: allMasteredExcept("") }));

    expect(screen.getByText("Everything mastered")).toBeDefined();
  });

  it("goes to the solve route of the problem when Start is pressed", async () => {
    const user = userEvent.setup();
    renderToday(aSaveFile({ entries: TWO_DUE_REVIEWS }));

    await user.click(screen.getByRole("link", { name: "Start Contains Duplicate" }));

    expect(screen.getByText("Solving contains-duplicate")).toBeDefined();
  });
});
