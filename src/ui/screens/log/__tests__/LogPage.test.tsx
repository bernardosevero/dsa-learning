import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_SAVE_FILE, type SaveFile } from "@/domain/types";
import { STORAGE_KEY } from "@/storage/localStore";
import { anAttempt, aSaveFile } from "@/test/builders";
import { AppDataProvider } from "@/ui/app/AppData";

import { LogPage } from "../LogPage";

// The earlier attempt took 25 minutes, so the time comparison has something to report.
const PREVIOUS_TIME_MINUTES = 25;
const NOW = new Date(2026, 9, 1, 10, 0);
const TWENTY_MINUTES_AGO = new Date(NOW.getTime() - 20 * 60_000).toISOString();

function readStoredFile(): SaveFile {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as SaveFile; // safe: written by the provider
}

function renderLog(path: string, file: SaveFile = aSaveFile()) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
  render(
    <AppDataProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="log/:problemId" element={<LogPage />} />
        </Routes>
      </MemoryRouter>
    </AppDataProvider>,
  );
}

function ratingRadio(name: string): HTMLElement {
  return screen.getByRole("radio", { name });
}

function isChecked(radio: HTMLElement): boolean {
  return radio.getAttribute("aria-checked") === "true";
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: NOW });
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("LogPage form", () => {
  it("pre-selects Hard and Solution when the user looked at the solution", () => {
    renderLog("/log/two-sum?help=solution");

    expect(isChecked(ratingRadio("Hard"))).toBe(true);
    expect(isChecked(screen.getByRole("radio", { name: "Solution" }))).toBe(true);
  });

  it("lets the user change the pre-selected Hard", async () => {
    const user = userEvent.setup();
    renderLog("/log/two-sum?help=solution");

    await user.click(ratingRadio("Medium"));

    expect(isChecked(ratingRadio("Medium"))).toBe(true);
    expect(isChecked(ratingRadio("Hard"))).toBe(false);
  });

  it("says the pattern is hidden on a review, unless the user opted in to see it", () => {
    const review = aSaveFile({
      entries: [
        anAttempt({
          problemId: "two-sum",
          timeMinutes: PREVIOUS_TIME_MINUTES,
          date: "2026-09-01",
        }),
      ],
    });
    const optedIn = { ...EMPTY_SAVE_FILE.settings, showPatternOnReviews: true };

    renderLog("/log/two-sum", { ...review, settings: optedIn });

    expect(screen.getByText("Review")).toBeDefined();
    expect(screen.queryByText("Review · pattern hidden")).toBeNull();
    expect(screen.getByText("Arrays & Hashing")).toBeDefined();
  });

  it("prefills the time from the timer, rounded up", () => {
    renderLog(
      "/log/two-sum",
      aSaveFile({ activeTimer: { problemId: "two-sum", startedAt: TWENTY_MINUTES_AGO } }),
    );

    expect(screen.getByRole("spinbutton", { name: "Time" })).toHaveProperty("value", "20");
    expect(screen.getByText("From the timer")).toBeDefined();
  });

  it("won't save without a rating", async () => {
    const user = userEvent.setup();
    renderLog("/log/two-sum");
    await user.type(screen.getByRole("spinbutton", { name: "Time" }), "20");

    await user.click(screen.getByRole("button", { name: /Save/ }));

    expect(screen.getByText("Choose how it felt.")).toBeDefined();
    expect(readStoredFile().entries).toHaveLength(0);
  });

  it("won't save with a time of 0", async () => {
    const user = userEvent.setup();
    renderLog("/log/two-sum");
    await user.click(ratingRadio("Medium"));
    await user.type(screen.getByRole("spinbutton", { name: "Time" }), "0");

    await user.click(screen.getByRole("button", { name: /Save/ }));

    expect(screen.getByText("Enter the time in minutes, from 1 to 600.")).toBeDefined();
    expect(readStoredFile().entries).toHaveLength(0);
  });

  it("chooses the rating with 1/2/3 and saves with Ctrl+Enter", async () => {
    const user = userEvent.setup();
    renderLog(
      "/log/two-sum",
      aSaveFile({ activeTimer: { problemId: "two-sum", startedAt: TWENTY_MINUTES_AGO } }),
    );

    await user.keyboard("3");
    await user.keyboard("{Control>}{Enter}{/Control}");

    expect(readStoredFile().entries).toMatchObject([{ rating: "easy" }]);
  });
});

describe("LogPage saving", () => {
  it("saves exactly one attempt with the right fields and clears the timer", async () => {
    const user = userEvent.setup();
    renderLog(
      "/log/two-sum",
      aSaveFile({ activeTimer: { problemId: "two-sum", startedAt: TWENTY_MINUTES_AGO } }),
    );
    await user.click(ratingRadio("Medium"));
    await user.click(screen.getByRole("radio", { name: "Hint" }));
    await user.type(
      screen.getByRole("textbox", { name: "Key insight" }),
      "  complement in a map  ",
    );

    await user.click(screen.getByRole("button", { name: /Save/ }));

    const stored = readStoredFile();
    expect(stored.entries).toHaveLength(1);
    const { id, ...attempt } = stored.entries[0] ?? {};
    expect(id).toBeTypeOf("string");
    expect(attempt).toEqual({
      type: "attempt",
      problemId: "two-sum",
      startedAt: TWENTY_MINUTES_AGO,
      completedAt: NOW.toISOString(),
      date: "2026-10-01",
      rating: "medium",
      timeMinutes: 20,
      help: "hint",
      keyInsight: "complement in a map",
    });
    expect(stored).not.toHaveProperty("activeTimer");
  });

  it("shows the next re-solve date from the new schedule", async () => {
    const user = userEvent.setup();
    renderLog("/log/two-sum");
    await user.click(ratingRadio("Hard"));
    await user.type(screen.getByRole("spinbutton", { name: "Time" }), "30");

    await user.click(screen.getByRole("button", { name: /Save/ }));

    expect(screen.getByText("Next re-solve: 2026-10-03")).toBeDefined();
  });

  it("keeps the pattern and earlier insights hidden while logging a review", () => {
    const previous = anAttempt({
      problemId: "two-sum",
      timeMinutes: PREVIOUS_TIME_MINUTES,
      date: "2026-09-01",
      keyInsight: "store what you've seen",
    });

    renderLog("/log/two-sum", aSaveFile({ entries: [previous] }));

    expect(screen.queryByText("Arrays & Hashing")).toBeNull();
    expect(screen.queryByText("store what you've seen")).toBeNull();
  });

  it("reveals the pattern, the last attempt's insight and the solution link once saved", async () => {
    const user = userEvent.setup();
    const previous = anAttempt({
      problemId: "two-sum",
      timeMinutes: PREVIOUS_TIME_MINUTES,
      date: "2026-09-01",
      keyInsight: "store what you've seen",
    });
    renderLog("/log/two-sum", aSaveFile({ entries: [previous] }));
    await user.click(ratingRadio("Medium"));
    await user.type(screen.getByRole("spinbutton", { name: "Time" }), "15");

    await user.click(screen.getByRole("button", { name: /Save/ }));

    const revealed = within(screen.getByRole("region", { name: "Now revealed" }));
    expect(revealed.getByText("Arrays & Hashing")).toBeDefined();
    expect(revealed.getByText("store what you've seen")).toBeDefined();
    expect(revealed.getByText("10 min faster")).toBeDefined();
    expect(revealed.getByRole("link", { name: /Solution on NeetCode/ })).toHaveProperty(
      "href",
      "https://neetcode.io/solutions/two-sum",
    );
  });

  it("says Mastered! after Easy on a due review that followed an Easy", async () => {
    const user = userEvent.setup();
    const easy = anAttempt({
      problemId: "two-sum",
      timeMinutes: PREVIOUS_TIME_MINUTES,
      rating: "easy",
      date: "2026-09-01",
    });
    renderLog("/log/two-sum", aSaveFile({ entries: [easy] }));
    await user.click(ratingRadio("Easy"));
    await user.type(screen.getByRole("spinbutton", { name: "Time" }), "10");

    await user.click(screen.getByRole("button", { name: /Save/ }));

    expect(screen.getByText("Mastered!")).toBeDefined();
    expect(screen.getByText("1 of 150 mastered")).toBeDefined();
  });

  it("undoes a save by marking the attempt deleted and reopening the form", async () => {
    const user = userEvent.setup();
    renderLog("/log/two-sum");
    await user.click(ratingRadio("Hard"));
    await user.type(screen.getByRole("spinbutton", { name: "Time" }), "30");
    await user.click(screen.getByRole("button", { name: /Save/ }));

    await user.click(screen.getByRole("button", { name: "Undo" }));

    expect(readStoredFile().entries[0]?.deletedAt).toBeDefined();
    expect(isChecked(ratingRadio("Hard"))).toBe(true);
    expect(screen.getByRole("spinbutton", { name: "Time" })).toHaveProperty("value", "30");
  });
});
