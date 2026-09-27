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

// Eight due reviews: the focus plus seven rows, two more than a backlog shows at first.
const EIGHT_DUE_REVIEWS = PROBLEMS.slice(0, 8).map((problem) =>
  anAttempt({ problemId: problem.id, rating: "hard" }),
);

// Matches a paragraph by its whole text, even when parts of it sit in their own spans.
function paragraphWithText(text: string) {
  return function matches(_content: string, element: Element | null): boolean {
    return element?.tagName === "P" && element.textContent === text;
  };
}

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
    expect(dueReviews.getByText(paragraphWithText("Easy · 7 days overdue"))).toBeDefined();
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
    expect(
      dueReviews.getByText(paragraphWithText("Arrays & Hashing · Easy · 7 days overdue")),
    ).toBeDefined();
  });

  it("keeps the due section with a nothing-due note and makes the new problem the focus", () => {
    const scheduled = anAttempt({ problemId: "contains-duplicate", date: "2026-10-08" });

    renderToday(aSaveFile({ entries: [scheduled] }));

    const dueReviews = within(screen.getByRole("region", { name: /Due reviews/ }));
    expect(dueReviews.getByText(/No reviews due today/)).toBeDefined();
    const newSection = within(screen.getByRole("region", { name: /New/ }));
    expect(newSection.getByText("★ Up next")).toBeDefined();
    expect(newSection.getByText("Valid Anagram", { selector: "p" })).toBeDefined();
  });

  it("hides the new section when no new problem is left", () => {
    const dueReview = anAttempt({ problemId: "contains-duplicate", rating: "hard" });

    renderToday(aSaveFile({ entries: [...allMasteredExcept("contains-duplicate"), dueReview] }));

    expect(screen.getByRole("region", { name: /Due reviews/ })).toBeDefined();
    expect(screen.queryByRole("region", { name: /New/ })).toBeNull();
  });

  it("shows a big backlog as the focus plus five rows, with a no-penalty note", () => {
    renderToday(aSaveFile({ entries: EIGHT_DUE_REVIEWS }));

    const dueReviews = within(screen.getByRole("region", { name: /Due reviews/ }));
    expect(dueReviews.getByText(/Overdue reviews carry no penalty/)).toBeDefined();
    expect(dueReviews.getAllByRole("listitem")).toHaveLength(5);
  });

  it("shows the rest of a big backlog when asked", async () => {
    const user = userEvent.setup();
    renderToday(aSaveFile({ entries: EIGHT_DUE_REVIEWS }));
    const dueReviews = within(screen.getByRole("region", { name: /Due reviews/ }));

    await user.click(dueReviews.getByRole("button", { name: "Show the other 2 due reviews" }));

    expect(dueReviews.getAllByRole("listitem")).toHaveLength(7);
    expect(dueReviews.queryByRole("button", { name: /Show the other/ })).toBeNull();
  });

  it("introduces the app and offers the first problem on the first run", () => {
    renderToday(aSaveFile());

    expect(screen.getByRole("heading", { name: /Re-solve problems right before/ })).toBeDefined();
    expect(screen.getByText("★ Your first problem")).toBeDefined();
    expect(screen.getByRole("link", { name: "Start Contains Duplicate" })).toBeDefined();
    expect(screen.queryByText("New left")).toBeNull();
    expect(screen.queryByRole("region", { name: /Due reviews/ })).toBeNull();
  });

  it("says all caught up with the next review date when nothing is due or new", () => {
    const scheduled = anAttempt({ problemId: "two-sum", date: "2026-10-08" });

    renderToday(aSaveFile({ entries: [...allMasteredExcept("two-sum"), scheduled] }));

    expect(screen.getByRole("heading", { name: "All caught up" })).toBeDefined();
    expect(screen.getByText("Next review")).toBeDefined();
    expect(screen.getByText(/Thu, Oct 15/).textContent).toBe("Thu, Oct 15 · in 5 days");
    expect(screen.queryByRole("region", { name: /Due reviews/ })).toBeNull();
  });

  it("says everything mastered when nothing is scheduled any more", () => {
    renderToday(aSaveFile({ entries: allMasteredExcept("") }));

    expect(screen.getByRole("heading", { name: "Everything mastered" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Open Problems" })).toBeDefined();
  });

  it("goes to the solve route of the problem when Start is pressed", async () => {
    const user = userEvent.setup();
    renderToday(aSaveFile({ entries: TWO_DUE_REVIEWS }));

    await user.click(screen.getByRole("link", { name: "Start Contains Duplicate" }));

    expect(screen.getByText("Solving contains-duplicate")).toBeDefined();
  });
});
