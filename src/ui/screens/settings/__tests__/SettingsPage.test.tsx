import { render, screen, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SaveFile } from "@/domain/types";
import { downloadExport } from "@/storage/download";
import { STORAGE_KEY } from "@/storage/localStore";
import type { AccountService } from "@/storage/accountService";
import type { RemoteStore } from "@/storage/remoteStore";
import { aMasteredMark, anAttempt, aSaveFile } from "@/test/builders";
import { aFakeRemote } from "@/test/fakeRemoteStore";
import { aFakeSupabase } from "@/test/fakeSupabase";
import { AppDataProvider } from "@/ui/app/AppData";
import { track } from "@/ui/shared/analytics";

import { SettingsPage } from "../SettingsPage";

// The real export builds a download link with browser APIs jsdom lacks; the call is what matters.
vi.mock("@/storage/download", () => ({ downloadExport: vi.fn() }));
vi.mock("@/ui/shared/analytics", () => ({ track: vi.fn(), setAnalyticsEnabled: vi.fn() }));

const STORED_ATTEMPT = anAttempt({ id: "stored" });

function renderSettings(
  file: SaveFile = aSaveFile({ entries: [STORED_ATTEMPT] }),
  accountService?: AccountService,
  remoteStore?: RemoteStore,
) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file));
  render(
    <AppDataProvider accountService={accountService} remoteStore={remoteStore}>
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

    await userEvent.click(screen.getByRole("switch", { name: "Share usage data" }));

    expect(readStoredFile().settings.shareAnonymousUsage).toBe(false);
  });

  it("exports the save file", async () => {
    renderSettings();

    await userEvent.click(screen.getByRole("button", { name: "Download JSON" }));

    expect(downloadExport).toHaveBeenCalledWith(readStoredFile());
    expect(track).toHaveBeenCalledWith("exported");
  });

  it("merges an imported file and shows how many entries it added", async () => {
    renderSettings();
    const exported = aSaveFile({
      entries: [STORED_ATTEMPT, anAttempt({ id: "new-one" }), aMasteredMark({ id: "new-two" })],
    });

    await userEvent.upload(fileInput(), aJsonFile(exported));

    expect(await screen.findByText("Imported: 2 new entries")).toBeDefined();
    expect(track).toHaveBeenCalledWith("imported", { added: 2 });
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

describe("SettingsPage account", () => {
  it("offers GitHub sign-in when signed out, and says what an account is for", async () => {
    const fake = aFakeSupabase();
    renderSettings(undefined, fake.accountService);

    await userEvent.click(await screen.findByRole("button", { name: "Sign in with GitHub" }));

    expect(screen.getByText(/syncs your progress across your devices/)).toBeDefined();
    expect(fake.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "github" }),
    );
  });

  it("shows the signed-in email", async () => {
    renderSettings(undefined, aFakeSupabase({ email: "ada@example.com" }).accountService);

    expect(await screen.findByText("ada@example.com")).toBeDefined();
  });

  it("signs out and leaves the local log untouched", async () => {
    const fake = aFakeSupabase({ email: "ada@example.com" });
    renderSettings(undefined, fake.accountService);
    const before = readStoredFile();

    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    expect(fake.signOut).toHaveBeenCalled();
    expect(await screen.findByRole("button", { name: "Sign in with GitHub" })).toBeDefined();
    expect(readStoredFile()).toEqual(before);
  });

  it("asks before deleting the account, then deletes it and keeps the local log", async () => {
    const fake = aFakeSupabase({ email: "ada@example.com" });
    renderSettings(undefined, fake.accountService);
    const before = readStoredFile();

    await userEvent.click(await screen.findByRole("button", { name: "Delete account" }));
    const dialog = screen.getByRole("alertdialog");
    expect(dialog.textContent).toContain(
      "Your account and its cloud copy are deleted. This device keeps its progress.",
    );
    expect(fake.rpc).not.toHaveBeenCalled();
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete account" }));

    expect(fake.rpc).toHaveBeenCalledWith("delete_my_account");
    expect(await screen.findByRole("button", { name: "Sign in with GitHub" })).toBeDefined();
    expect(readStoredFile()).toEqual(before);
    expect(readStoredFile().entries).toHaveLength(1);
  });

  it("keeps the account and says so when deleting fails", async () => {
    const fake = aFakeSupabase({ email: "ada@example.com" });
    fake.rpc.mockResolvedValueOnce({ data: null, error: { message: "offline" } });
    renderSettings(undefined, fake.accountService);

    await userEvent.click(await screen.findByRole("button", { name: "Delete account" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete account" }),
    );

    expect((await screen.findByRole("alert")).textContent).toContain("Something went wrong");
    expect(screen.getByText("ada@example.com")).toBeDefined();
  });

  it("says when the account last synced", async () => {
    const fake = aFakeSupabase({ email: "ada@example.com" });
    renderSettings(undefined, fake.accountService, aFakeRemote().remoteStore);

    expect(await screen.findByText("just now")).toBeDefined();
    expect(screen.getByText(/^Synced/)).toBeDefined();
  });

  it("says sync is offline when the account's copy can't be reached", async () => {
    const remote = aFakeRemote();
    remote.setOffline(true);
    renderSettings(undefined, aFakeSupabase({}).accountService, remote.remoteStore);

    expect(await screen.findByText("Offline — will sync when you're back")).toBeDefined();
  });

  it("warns that a signed-in reset reaches every device, and resets by deleting every entry", async () => {
    const fake = aFakeSupabase({ email: "ada@example.com" });
    renderSettings(undefined, fake.accountService, aFakeRemote().remoteStore);
    expect(
      await screen.findByText(
        "This resets your progress on every device. Importing an older export won't bring it back.",
      ),
    ).toBeDefined();

    await userEvent.type(screen.getByLabelText("Type reset to confirm"), "reset");
    await userEvent.click(screen.getByRole("button", { name: "Reset progress" }));

    const entries = readStoredFile().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0]?.deletedAt).toBeDefined();
  });
});
