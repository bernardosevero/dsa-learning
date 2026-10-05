import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { RouterProvider } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AccountService } from "@/storage/accountService";
import type { RemoteStore } from "@/storage/remoteStore";
import { createAppRouter } from "@/test/appRouter";
import { aFakeRemote } from "@/test/fakeRemoteStore";
import { aFakeSupabase } from "@/test/fakeSupabase";

vi.mock("@/ui/shared/analytics", () => ({
  track: vi.fn(),
  trackPageView: vi.fn(),
  setAnalyticsEnabled: vi.fn(),
}));

function renderAt(path: string, accountService?: AccountService, remoteStore?: RemoteStore) {
  render(<RouterProvider router={createAppRouter(path, { accountService, remoteStore })} />);
}

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("the header's account control", () => {
  it("shows no login UI in the header or Settings when accounts are unavailable", () => {
    renderAt("/settings");

    expect(screen.queryByRole("button", { name: "Sign in with GitHub" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Account settings" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Account" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Sign in with GitHub" })).toBeNull();
  });

  it("shows Sign in with GitHub when signed out, and starts GitHub sign-in from it", async () => {
    const fake = aFakeSupabase();
    renderAt("/", fake.accountService);

    await userEvent.click(await screen.findByRole("button", { name: "Sign in with GitHub" }));

    expect(fake.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "github" }),
    );
  });

  it("shows the avatar linking to the account in Settings when signed in", async () => {
    const fake = aFakeSupabase({ email: "ada@example.com" });
    renderAt("/", fake.accountService);

    const avatarLink = await screen.findByRole("link", { name: "Account settings" });

    expect(avatarLink.getAttribute("href")).toBe("/settings#account");
    expect(avatarLink.textContent).toBe("A");
    expect(screen.queryByRole("button", { name: "Sign in with GitHub" })).toBeNull();
  });

  it("tells the sync status on the avatar, in words as well as the dot", async () => {
    const fake = aFakeSupabase({ email: "ada@example.com" });
    renderAt("/", fake.accountService, aFakeRemote().remoteStore);

    const avatarLink = await screen.findByRole("link", { name: "Account settings · Synced" });

    expect(avatarLink.getAttribute("href")).toBe("/settings#account");
  });

  it("tells when sync is paused on an invalid account copy", async () => {
    const fake = aFakeSupabase({ email: "ada@example.com" });
    renderAt("/", fake.accountService, aFakeRemote({ entries: 1 }).remoteStore);

    expect(
      await screen.findByRole("link", {
        name: "Account settings · Sync paused — export your data and contact me",
      }),
    ).toBeDefined();
  });
});
