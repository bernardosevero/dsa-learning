import { describe, expect, it, vi } from "vitest";

import { aFakeSupabase } from "@/test/fakeSupabase";

import { createSupabase, deleteMyAccount } from "../supabase";

const URL = "https://example.supabase.co";
const KEY = "sb_publishable_test";

describe("createSupabase", () => {
  it("returns undefined when the URL is missing", () => {
    expect(createSupabase({ VITE_SUPABASE_PUBLISHABLE_KEY: KEY })).toBeUndefined();
  });

  it("returns undefined when the publishable key is missing", () => {
    expect(createSupabase({ VITE_SUPABASE_URL: URL })).toBeUndefined();
  });

  it("returns undefined when a variable is empty", () => {
    expect(
      createSupabase({ VITE_SUPABASE_URL: "", VITE_SUPABASE_PUBLISHABLE_KEY: KEY }),
    ).toBeUndefined();
  });

  it("returns a client when both variables are set", () => {
    const client = createSupabase({ VITE_SUPABASE_URL: URL, VITE_SUPABASE_PUBLISHABLE_KEY: KEY });

    expect(client).toBeDefined();
  });
});

describe("deleteMyAccount", () => {
  it("deletes the account through the RPC, then signs out", async () => {
    const fake = aFakeSupabase({ email: "ada@example.com" });

    const result = await deleteMyAccount(fake.client);

    expect(result).toEqual({ ok: true });
    expect(fake.rpc).toHaveBeenCalledWith("delete_my_account");
    expect(fake.signOut).toHaveBeenCalled();
  });

  it("returns the error and stays signed in when the RPC fails", async () => {
    const fake = aFakeSupabase({ email: "ada@example.com" });
    fake.rpc.mockResolvedValueOnce({ data: null, error: { message: "offline" } });

    const result = await deleteMyAccount(fake.client);

    expect(result).toEqual({ ok: false, error: "offline" });
    expect(fake.signOut).not.toHaveBeenCalled();
  });
});

describe("createSupabaseAccountService", () => {
  it("reports the signed-in user with their GitHub avatar", async () => {
    const fake = aFakeSupabase({
      id: "user-7",
      email: "ada@example.com",
      avatarUrl: "https://avatars.example.com/ada",
    });
    const listener = vi.fn();

    fake.accountService.onUserChange(listener);
    await Promise.resolve();

    expect(listener).toHaveBeenCalledWith({
      id: "user-7",
      email: "ada@example.com",
      avatarUrl: "https://avatars.example.com/ada",
    });
  });

  it("reports no user when signed out", async () => {
    const listener = vi.fn();

    aFakeSupabase().accountService.onUserChange(listener);
    await Promise.resolve();

    expect(listener).toHaveBeenCalledWith(undefined);
  });
});
