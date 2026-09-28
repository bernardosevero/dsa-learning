import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SaveFile } from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";
import { aMasteredMark, anAttempt, aSaveFile } from "@/test/builders";
import { AppDataProvider } from "@/ui/app/AppData";

import { ProblemsPage } from "../ProblemsPage";

// Today is 2026-10-10.
const DUE_TWO_SUM = anAttempt({
  id: "due",
  problemId: "two-sum",
  rating: "hard",
  date: "2026-10-01",
});
const SCHEDULED_VALID_ANAGRAM = anAttempt({
  id: "scheduled",
  problemId: "valid-anagram",
  rating: "medium",
  date: "2026-10-08",
});
const MASTERED_CONTAINS_DUPLICATE = aMasteredMark({ problemId: "contains-duplicate" });

function renderProblems(file: SaveFile = aSaveFile()) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
  render(
    <AppDataProvider>
      <MemoryRouter initialEntries={["/problems"]}>
        <Routes>
          <Route path="problems" element={<ProblemsPage />} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
}

function rowOf(title: string) {
  const row = screen.getByRole("link", { name: title }).closest("tr");
  if (row === null) {
    throw new Error(`${title} has no row`);
  }
  return within(row);
}

// The line under the title; its rating and date parts only show on narrow windows.
function detailLineOf(title: string): string | null {
  const titleCell = screen.getByRole("link", { name: title }).closest("td");
  return titleCell?.querySelector("p")?.textContent ?? null;
}

function problemTitles(): string[] {
  return screen
    .getAllByRole("row")
    .map((row) => row.querySelector("a")?.textContent ?? "")
    .filter((title) => title !== "");
}

async function openMarkMasteredDialog(title: string) {
  await userEvent.click(screen.getByRole("button", { name: `Actions for ${title}` }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Mark as already mastered…" }));
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 10, 10, 0) });
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("ProblemsPage", () => {
  it("sums up started, mastered and total problems in the heading row", () => {
    renderProblems(
      aSaveFile({ entries: [DUE_TWO_SUM, SCHEDULED_VALID_ANAGRAM, MASTERED_CONTAINS_DUPLICATE] }),
    );

    expect(screen.getByText("2 started · 1 mastered · 150 total")).toBeDefined();
  });

  it("shows each row's status, last rating and next due date", () => {
    renderProblems(
      aSaveFile({ entries: [DUE_TWO_SUM, SCHEDULED_VALID_ANAGRAM, MASTERED_CONTAINS_DUPLICATE] }),
    );

    expect(rowOf("Two Sum").getByText("Due")).toBeDefined();
    expect(rowOf("Two Sum").getByRole("cell", { name: "Hard" })).toBeDefined();
    expect(rowOf("Two Sum").getByRole("cell", { name: "Oct 3" })).toBeDefined();
    expect(rowOf("Valid Anagram").getByText("Scheduled")).toBeDefined();
    expect(rowOf("Valid Anagram").getByRole("cell", { name: "Oct 15" })).toBeDefined();
    expect(rowOf("Contains Duplicate").getByText("Mastered")).toBeDefined();
  });

  it("sums up each row on one detail line for narrow windows", () => {
    const dueToday = anAttempt({
      id: "due-today",
      problemId: "group-anagrams",
      rating: "hard",
      date: "2026-10-08",
    });

    renderProblems(
      aSaveFile({
        entries: [DUE_TWO_SUM, SCHEDULED_VALID_ANAGRAM, MASTERED_CONTAINS_DUPLICATE, dueToday],
      }),
    );

    expect(detailLineOf("Valid Anagram")).toBe("Easy · felt Medium · next Oct 15");
    expect(detailLineOf("Two Sum")).toBe("Easy · felt Hard · 7 days overdue");
    expect(detailLineOf("Group Anagrams")).toBe("Medium · felt Hard · due today");
    expect(detailLineOf("Contains Duplicate")).toBe("Easy · marked as already mastered");
    expect(detailLineOf("Top K Frequent Elements")).toBe("Medium · up next");
    expect(detailLineOf("Encode and Decode Strings")).toBe("Medium");
  });

  it("marks the next new problem as up next", () => {
    renderProblems();

    expect(rowOf("Contains Duplicate").getByText("Easy · up next")).toBeDefined();
    expect(rowOf("Contains Duplicate").getByText("New")).toBeDefined();
  });

  it("marks a new problem as mastered after the confirmation, changing its badge", async () => {
    renderProblems();

    await openMarkMasteredDialog("Contains Duplicate");
    const dialog = within(
      screen.getByRole("alertdialog", { name: "Mark Contains Duplicate as mastered?" }),
    );
    expect(dialog.getByText(/It leaves the rotation/)).toBeDefined();
    await userEvent.click(dialog.getByRole("button", { name: "Mark as mastered" }));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(rowOf("Contains Duplicate").getByText("Mastered")).toBeDefined();
  });

  it("leaves the problem unchanged when the confirmation is cancelled", async () => {
    renderProblems();

    await openMarkMasteredDialog("Contains Duplicate");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(rowOf("Contains Duplicate").getByText("New")).toBeDefined();
  });

  it("doesn't offer to mark a mastered problem as mastered again", async () => {
    renderProblems(aSaveFile({ entries: [MASTERED_CONTAINS_DUPLICATE] }));

    await userEvent.click(screen.getByRole("button", { name: "Actions for Contains Duplicate" }));

    expect(screen.getByRole("menuitem", { name: "Start now" })).toBeDefined();
    expect(screen.queryByRole("menuitem", { name: "Mark as already mastered…" })).toBeNull();
  });

  it("shows only due problems under the Due filter", async () => {
    renderProblems(
      aSaveFile({ entries: [DUE_TWO_SUM, SCHEDULED_VALID_ANAGRAM, MASTERED_CONTAINS_DUPLICATE] }),
    );

    await userEvent.click(screen.getByRole("radio", { name: "Due 1" }));

    expect(problemTitles()).toEqual(["Two Sum"]);
  });

  it("counts every problem under each filter", () => {
    renderProblems(
      aSaveFile({ entries: [DUE_TWO_SUM, SCHEDULED_VALID_ANAGRAM, MASTERED_CONTAINS_DUPLICATE] }),
    );

    const filter = within(screen.getByRole("radiogroup", { name: "Filter" }));
    expect(filter.getByRole("radio", { name: "All 150" })).toBeDefined();
    expect(filter.getByRole("radio", { name: "Due 1" })).toBeDefined();
    expect(filter.getByRole("radio", { name: "New 147" })).toBeDefined();
    expect(filter.getByRole("radio", { name: "Mastered 1" })).toBeDefined();
  });

  it("opens and closes a topic from its header", async () => {
    renderProblems();
    const header = screen.getByRole("button", { name: /^Two Pointers/ });
    expect(header.getAttribute("aria-expanded")).toBe("false");

    await userEvent.click(header);

    expect(header.getAttribute("aria-expanded")).toBe("true");
    expect(rowOf("Valid Palindrome").getByText("New")).toBeDefined();
  });
});
