import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_SAVE_FILE, type SaveFile } from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";
import { aMasteredMark, anAttempt, aSaveFile } from "@/test/builders";
import { AppDataProvider } from "@/ui/app/AppData";

import { ProblemDetailPage } from "../ProblemDetailPage";

const PATTERN = "Arrays & Hashing";
const FIRST_INSIGHT = "Store each complement as you go";
const SECOND_INSIGHT = "One pass is enough";

// Today is 2026-10-10: the Medium on Oct 1 made Two Sum due on Oct 8, two days ago.
const DUE_HISTORY = [
  anAttempt({
    id: "first",
    problemId: "two-sum",
    date: "2026-09-03",
    rating: "hard",
    keyInsight: FIRST_INSIGHT,
  }),
  anAttempt({
    id: "second",
    problemId: "two-sum",
    date: "2026-10-01",
    rating: "medium",
    keyInsight: SECOND_INSIGHT,
  }),
];

function renderDetail(file: SaveFile = aSaveFile(), problemId = "two-sum") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
  render(
    <AppDataProvider>
      <MemoryRouter initialEntries={[`/problems/${problemId}`]}>
        <Routes>
          <Route path="problems/:problemId" element={<ProblemDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
}

function historyList() {
  return within(screen.getByRole("list"));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 10, 10, 0) });
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("ProblemDetailPage", () => {
  it("shows the title, summary, status and how overdue a due problem is", () => {
    renderDetail(aSaveFile({ entries: DUE_HISTORY }));

    expect(screen.getByRole("heading", { level: 1, name: "Two Sum" })).toBeDefined();
    expect(screen.getByText("Due")).toBeDefined();
    expect(screen.getByText("2 days overdue")).toBeDefined();
  });

  it("hides a due problem's pattern and earlier insights until the reveal toggle is used", async () => {
    renderDetail(aSaveFile({ entries: DUE_HISTORY }));

    expect(screen.queryByText(new RegExp(PATTERN))).toBeNull();
    expect(screen.queryByText(FIRST_INSIGHT)).toBeNull();
    expect(screen.queryByText(SECOND_INSIGHT)).toBeNull();
    expect(screen.queryByText("Solution & video")).toBeNull();
    expect(screen.getByText(/Pattern, 2 earlier insights, solution and video/)).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "Reveal (spoilers)" }));

    expect(screen.getByText(new RegExp(PATTERN))).toBeDefined();
    expect(screen.getByText(FIRST_INSIGHT)).toBeDefined();
    expect(screen.getByText(SECOND_INSIGHT)).toBeDefined();
    expect(screen.getByText("Solution & video")).toBeDefined();
  });

  it("shows only the pattern of a due problem when the user opted in", () => {
    const settings = { ...EMPTY_SAVE_FILE.settings, showPatternOnReviews: true };

    renderDetail(aSaveFile({ entries: DUE_HISTORY, settings }));

    expect(screen.getByText(new RegExp(PATTERN))).toBeDefined();
    expect(screen.queryByText(FIRST_INSIGHT)).toBeNull();
    expect(screen.getByText(/^2 earlier insights, solution and video/)).toBeDefined();
  });

  it("shows the pattern, insights and solution of a problem that isn't due", () => {
    const scheduled = anAttempt({
      problemId: "two-sum",
      date: "2026-10-08",
      keyInsight: FIRST_INSIGHT,
    });

    renderDetail(aSaveFile({ entries: [scheduled] }));

    expect(screen.getByText(new RegExp(PATTERN))).toBeDefined();
    expect(screen.getByText(FIRST_INSIGHT)).toBeDefined();
    expect(screen.getByText("Solution & video")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Reveal (spoilers)" })).toBeNull();
  });

  it("lists the history newest first, with the first attempt tagged", () => {
    renderDetail(aSaveFile({ entries: DUE_HISTORY }));

    const items = historyList().getAllByRole("listitem");
    expect(items.map((item) => within(item).getByText(/^(Sep|Oct) \d+$/).textContent)).toEqual([
      "Oct 1",
      "Sep 3",
    ]);
    expect(within(items[1] ?? document.body).getByText("First try")).toBeDefined();
    expect(screen.getByText("History · 2 attempts")).toBeDefined();
  });

  it("shows a mastered mark in the history", () => {
    renderDetail(aSaveFile({ entries: [aMasteredMark({ problemId: "two-sum" })] }));

    expect(historyList().getByText("Marked as already mastered")).toBeDefined();
    expect(screen.queryByRole("button", { name: "Mark as already mastered" })).toBeNull();
  });

  it("doesn't show deleted entries", () => {
    const deleted = anAttempt({
      id: "deleted",
      problemId: "two-sum",
      date: "2026-10-05",
      deletedAt: "2026-10-05T13:00:00.000Z",
    });

    renderDetail(aSaveFile({ entries: [...DUE_HISTORY, deleted] }));

    expect(historyList().getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Delete the Oct 5 attempt" })).toBeNull();
  });

  it("restores the previous status and due date after deleting the latest attempt", async () => {
    const easy = anAttempt({
      id: "easy",
      problemId: "two-sum",
      date: "2026-10-01",
      rating: "easy",
    });
    const hard = anAttempt({
      id: "hard",
      problemId: "two-sum",
      date: "2026-10-08",
      rating: "hard",
    });
    renderDetail(aSaveFile({ entries: [easy, hard] }));
    expect(screen.getByText("Due")).toBeDefined();

    await userEvent.click(screen.getByRole("button", { name: "Delete the Oct 8 attempt" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog", { name: "Delete the Oct 8 attempt?" })).getByRole(
        "button",
        { name: "Delete" },
      ),
    );

    expect(screen.getByText("Scheduled")).toBeDefined();
    expect(screen.getByText("next Oct 31")).toBeDefined();
    expect(historyList().getAllByRole("listitem")).toHaveLength(1);
  });

  it("keeps the entry when the delete is cancelled", async () => {
    renderDetail(aSaveFile({ entries: DUE_HISTORY }));

    await userEvent.click(screen.getByRole("button", { name: "Delete the Oct 1 attempt" }));
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(historyList().getAllByRole("listitem")).toHaveLength(2);
  });

  it("marks the problem as already mastered after the confirmation", async () => {
    renderDetail();

    await userEvent.click(screen.getByRole("button", { name: "Mark as already mastered" }));
    await userEvent.click(screen.getByRole("button", { name: "Mark as mastered" }));

    expect(screen.getByText("Mastered")).toBeDefined();
    expect(historyList().getByText("Marked as already mastered")).toBeDefined();
  });

  it("links Start to the Solving screen", () => {
    renderDetail();

    const start = screen.getByRole("link", { name: "Start Two Sum" });

    expect(start.getAttribute("href")).toBe("/solve/two-sum");
  });

  it("hides the spoilers again when moving straight to another due problem", async () => {
    const dueAnagram = anAttempt({
      id: "anagram",
      problemId: "valid-anagram",
      date: "2026-10-01",
      keyInsight: SECOND_INSIGHT,
    });
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(aSaveFile({ entries: [...DUE_HISTORY, dueAnagram] })),
    );
    render(
      <AppDataProvider>
        <MemoryRouter initialEntries={["/problems/two-sum"]}>
          <Routes>
            <Route
              path="problems/:problemId"
              element={
                <>
                  <ProblemDetailPage />
                  <Link to="/problems/valid-anagram">Go to Valid Anagram</Link>
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </AppDataProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Reveal (spoilers)" }));

    await userEvent.click(screen.getByRole("link", { name: "Go to Valid Anagram" }));

    expect(screen.getByRole("heading", { level: 1, name: "Valid Anagram" })).toBeDefined();
    expect(screen.queryByText(SECOND_INSIGHT)).toBeNull();
    expect(screen.getByRole("button", { name: "Reveal (spoilers)" })).toBeDefined();
  });

  it("says so when the problem isn't in the list", () => {
    renderDetail(aSaveFile(), "not-a-problem");

    expect(screen.getByText("This problem isn't in the list.")).toBeDefined();
  });
});
