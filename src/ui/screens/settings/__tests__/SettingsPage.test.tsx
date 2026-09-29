import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SaveFile } from "@/domain/types";
import { downloadExport } from "@/storage/download";
import { STORAGE_KEY } from "@/storage/localStore";
import { aMasteredMark, anAttempt, aSaveFile } from "@/test/builders";
import { AppDataProvider } from "@/ui/app/AppData";

import { SettingsPage } from "../SettingsPage";

// The real export builds a download link with browser APIs jsdom lacks; the call is what matters.
vi.mock("@/storage/download", () => ({ downloadExport: vi.fn() }));

const STORED_ATTEMPT = anAttempt({ id: "stored" });

function renderSettings(file: SaveFile = aSaveFile({ entries: [STORED_ATTEMPT] })) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
  render(
    <AppDataProvider>
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

function readStoredFile(): SaveFile {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as SaveFile; // safe: written by the provider
}

function fileInput(): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>("input[type='file']");
  if (input === null) {
    throw new Error("Settings has no file input");
  }
  return input;
}

function aJsonFile(content: unknown, name = "dsa-learning-2026-09-20.json"): File {
  return new File([JSON.stringify(content)], name, { type: "application/json" });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"], now: new Date(2026, 9, 10, 10, 0) });
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("SettingsPage", () => {
  it("saves a changed time box", async () => {
    renderSettings();
    const medium = screen.getByLabelText("Medium");

    await userEvent.clear(medium);
    await userEvent.type(medium, "25");

    expect(readStoredFile().settings.timeBoxMinutes).toEqual({ Easy: 15, Medium: 25, Hard: 45 });
  });

  it("doesn't save a time box outside 1 to 180 minutes and says why", async () => {
    renderSettings();
    const hard = screen.getByLabelText("Hard");

    await userEvent.clear(hard);
    await userEvent.type(hard, "0");

    expect(readStoredFile().settings.timeBoxMinutes.Hard).toBe(45);
    const errorId = hard.getAttribute("aria-describedby") ?? "";
    expect(document.getElementById(errorId)?.textContent).toBe(
      "Enter whole minutes, from 1 to 180.",
    );
  });

  it("saves the show-the-pattern switch", async () => {
    renderSettings();

    await userEvent.click(screen.getByRole("switch", { name: "Show the pattern on reviews" }));

    expect(readStoredFile().settings.showPatternOnReviews).toBe(true);
  });

  it("saves the anonymous usage opt-out", async () => {
    renderSettings();

    await userEvent.click(screen.getByRole("switch", { name: "Share anonymous usage data" }));

    expect(readStoredFile().settings.shareAnonymousUsage).toBe(false);
  });

  it("exports the save file", async () => {
    renderSettings();

    await userEvent.click(screen.getByRole("button", { name: "Download JSON" }));

    expect(downloadExport).toHaveBeenCalledWith(readStoredFile());
  });

  it("merges an imported file and shows how many entries it added", async () => {
    renderSettings();
    const exported = aSaveFile({
      entries: [STORED_ATTEMPT, anAttempt({ id: "new-one" }), aMasteredMark({ id: "new-two" })],
    });

    await userEvent.upload(fileInput(), aJsonFile(exported));

    expect(await screen.findByText("Imported: 2 new entries")).toBeDefined();
    expect(
      readStoredFile()
        .entries.map((entry) => entry.id)
        .toSorted(),
    ).toEqual(["new-one", "new-two", "stored"]);
  });

  it("shows an error for an invalid file and leaves the data unchanged", async () => {
    renderSettings();
    const before = readStoredFile();

    await userEvent.upload(fileInput(), aJsonFile({ hello: "world" }, "notes.json"));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Couldn't import notes.json.");
    expect(alert.textContent).toContain("Your data is unchanged.");
    expect(readStoredFile()).toEqual(before);
  });

  it("keeps Reset progress disabled until reset is typed", async () => {
    renderSettings();
    const resetButton = screen.getByRole("button", { name: "Reset progress" });
    const confirmation = screen.getByLabelText("Type reset to confirm");
    expect(resetButton.hasAttribute("disabled")).toBe(true);

    await userEvent.type(confirmation, "rese");
    expect(resetButton.hasAttribute("disabled")).toBe(true);
    await userEvent.type(confirmation, "t");

    expect(resetButton.hasAttribute("disabled")).toBe(false);
  });

  it("empties the log on reset", async () => {
    renderSettings();

    await userEvent.type(screen.getByLabelText("Type reset to confirm"), "reset");
    await userEvent.click(screen.getByRole("button", { name: "Reset progress" }));

    expect(readStoredFile().entries).toEqual([]);
    expect(screen.getByText("Progress reset. Every problem is new again.")).toBeDefined();
  });

  it("credits the problem metadata with a link to its repository", () => {
    renderSettings();

    const credit = screen.getByRole("link", {
      name: /Problem metadata from neetcode-gh\/leetcode/,
    });

    expect(credit.getAttribute("href")).toBe("https://github.com/neetcode-gh/leetcode");
  });
});
