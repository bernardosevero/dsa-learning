import { describe, expect, it, vi } from "vitest";

import { anAttempt, aRemoteSave } from "@/test/builders";
import { aFakeSupabase } from "@/test/fakeSupabase";

import { createSupabase, deleteMyAccount, readSave, writeSave } from "../supabase";

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

describe("readSave", () => {
  it("returns undefined before the account's first sync", async () => {
    const fake = aFakeSupabase({}, { select: { data: null, error: null } });

    const result = await readSave(fake.client);

    expect(result).toEqual({ ok: true, value: undefined });
  });

  it("returns the parsed row", async () => {
    const row = aRemoteSave({ entries: [anAttempt()], version: 3 });
    const fake = aFakeSupabase({}, { select: { data: row, error: null } });

    const result = await readSave(fake.client);

    expect(result).toEqual({ ok: true, value: row });
  });

  it("reports an invalid row as invalid", async () => {
    const fake = aFakeSupabase({}, { select: { data: { entries: 7 }, error: null } });

    const result = await readSave(fake.client);

    expect(result).toMatchObject({ ok: false, reason: "invalid" });
  });

  it("reports a failed request as unreachable", async () => {
    const failure = { data: null, error: { message: "Failed to fetch" } };
    const fake = aFakeSupabase({}, { select: failure });

    const result = await readSave(fake.client);

    expect(result).toEqual({ ok: false, reason: "unreachable", error: "Failed to fetch" });
  });
});

describe("writeSave", () => {
  const save = { entries: [anAttempt()], settings: aRemoteSave().settings };

  it("inserts the row on the account's first sync", async () => {
    const fake = aFakeSupabase({});

    const result = await writeSave(fake.client, save, undefined);

    expect(result).toEqual({ ok: true, value: "written" });
    expect(fake.insert).toHaveBeenCalledWith(save);
  });

  it("returns a conflict when another device inserted the row first", async () => {
    const fake = aFakeSupabase({}, { insert: { error: { message: "duplicate", code: "23505" } } });

    const result = await writeSave(fake.client, save, undefined);

    expect(result).toEqual({ ok: true, value: "conflict" });
  });

  it("updates the row at the expected version and bumps it", async () => {
    const fake = aFakeSupabase({}, { update: { data: [{ version: 3 }], error: null } });

    const result = await writeSave(fake.client, save, 2);

    expect(result).toEqual({ ok: true, value: "written" });
    expect(fake.update).toHaveBeenCalledWith(expect.objectContaining({ ...save, version: 3 }), 2);
  });

  it("returns a conflict when the update matched no row", async () => {
    const fake = aFakeSupabase({}, { update: { data: [], error: null } });

    const result = await writeSave(fake.client, save, 2);

    expect(result).toEqual({ ok: true, value: "conflict" });
  });
});
