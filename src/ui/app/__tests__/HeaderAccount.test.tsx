import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AccountService } from "@/storage/accountService";
import { aFakeSupabase } from "@/test/fakeSupabase";

import { AppDataProvider } from "../AppData";
import { AppRoutes } from "../AppRoutes";

vi.mock("@/ui/shared/analytics", () => ({
  track: vi.fn(),
  trackPageView: vi.fn(),
  setAnalyticsEnabled: vi.fn(),
}));

function renderAt(path: string, accountService?: AccountService) {
  render(
    <AppDataProvider accountService={accountService}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AppDataProvider>,
  );
}

afterEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe("the header's account control", () => {
  it("shows no login UI in the header or Settings when accounts are unavailable", () => {
    renderAt("/settings");

    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Account settings" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Account" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Continue with GitHub" })).toBeNull();
  });

  it("shows Sign in when signed out, and starts GitHub sign-in from it", async () => {
    const fake = aFakeSupabase();
    renderAt("/", fake.accountService);

    await userEvent.click(await screen.findByRole("button", { name: "Sign in" }));

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
    expect(screen.queryByRole("button", { name: "Sign in" })).toBeNull();
  });
});
