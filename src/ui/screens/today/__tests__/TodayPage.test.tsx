import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PROBLEMS } from "@/data/problems";
import { EMPTY_SAVE_FILE, type Entry, type SaveFile } from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";
import { aMasteredMark, anAttempt, aSaveFile } from "@/test/builders";
import { aFakeRemote } from "@/test/fakeRemoteStore";
import { aFakeSupabase } from "@/test/fakeSupabase";
import { AppDataProvider } from "@/ui/app/AppData";

import { TodayPage } from "../TodayPage";

function allMasteredExcept(problemId: string): Entry[] {
  return PROBLEMS.filter((problem) => problem.id !== problemId).map((problem) =>
    aMasteredMark({ id: `mark-${problem.id}`, problemId: problem.id, date: "2026-09-01" }),
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

  it("lists progress by topic for started topics and the next new one, with their counts", () => {
    const entries = [
      ...TWO_DUE_REVIEWS,
      aMasteredMark({ problemId: "two-sum" }),
      anAttempt({ id: "two-pointers", problemId: "valid-palindrome" }),
    ];

    renderToday(aSaveFile({ entries }));

    const progress = screen.getByRole("region", { name: "Progress by topic" });
    const rows = within(progress).getAllByRole("listitem");
    expect(rows.map((row) => row.textContent)).toEqual([
      "Arrays & Hashing3/91 mastered, 2 started, of 9",
      "Two Pointers1/50 mastered, 1 started, of 5",
    ]);
    expect(within(progress).getByRole("link", { name: "All 18 topics in Problems" })).toBeDefined();
  });

  it("leaves progress by topic out on the first run", () => {
    renderToday(EMPTY_SAVE_FILE);

    expect(screen.queryByRole("region", { name: "Progress by topic" })).toBeNull();
  });

  it("renders the counters once, whatever the window width", () => {
    renderToday(aSaveFile({ entries: TWO_DUE_REVIEWS }));

    expect(screen.getAllByText("New left")).toHaveLength(1);
  });

  it("goes to the solve route of the problem when Start is pressed", async () => {
    const user = userEvent.setup();
    renderToday(aSaveFile({ entries: TWO_DUE_REVIEWS }));

    await user.click(screen.getByRole("link", { name: "Start Contains Duplicate" }));

    expect(screen.getByText("Solving contains-duplicate")).toBeDefined();
  });
});

describe("TodayPage while signed in", () => {
  it("shows a skeleton instead of the first run until the account's log arrives", async () => {
    const remote = aFakeRemote({
      entries: TWO_DUE_REVIEWS.map((entry, index) => ({ ...entry, id: `remote-${index}` })),
      settings: EMPTY_SAVE_FILE.settings,
      version: 1,
    });
    const releaseRead = remote.holdNextRead();
    render(
      <AppDataProvider
        accountService={aFakeSupabase({ email: "ada@example.com" }).accountService}
        remoteStore={remote.remoteStore}
      >
        <MemoryRouter>
          <TodayPage />
        </MemoryRouter>
      </AppDataProvider>,
    );

    expect(await screen.findByText("Loading your progress…")).toBeDefined();
    expect(screen.queryByText("Re-solve problems right before you forget them.")).toBeNull();
    releaseRead();

    expect(await screen.findByRole("region", { name: /Due reviews/ })).toBeDefined();
    expect(screen.queryByText("Loading your progress…")).toBeNull();
  });
});
