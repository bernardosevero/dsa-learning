import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

import type { Entry, Settings } from "@/domain/types";

import type { AccountResult, AccountService, AccountUser } from "./accountService";
import {
  parseRemoteSave,
  type ReadSaveResult,
  type RemoteStore,
  type WriteSaveResult,
} from "./remoteStore";

export type { SupabaseClient };

type SupabaseEnv = Readonly<Record<string, unknown>>;

function readNonEmpty(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined;
}

/**
 * Returns a client for the project in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, or
 * undefined when either is missing: the app then runs local-only, with no login anywhere.
 */
export function createSupabase(env: SupabaseEnv = import.meta.env): SupabaseClient | undefined {
  const url = readNonEmpty(env.VITE_SUPABASE_URL);
  const publishableKey = readNonEmpty(env.VITE_SUPABASE_PUBLISHABLE_KEY);
  if (url === undefined || publishableKey === undefined) {
    return undefined;
  }
  // The session persists in localStorage, so it survives reloads.
  return createClient(url, publishableKey, { auth: { flowType: "pkce" } });
}

/** Starts GitHub sign-in (OAuth with PKCE), which leaves the page and comes back to this origin. */
export async function signInWithGitHub(client: SupabaseClient): Promise<AccountResult> {
  const { error } = await client.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: window.location.origin },
  });
  return error === null ? { ok: true } : { ok: false, error: error.message };
}

/** Signs out of the account. Only the session goes; the local log stays. */
export async function signOut(client: SupabaseClient): Promise<AccountResult> {
  const { error } = await client.auth.signOut();
  return error === null ? { ok: true } : { ok: false, error: error.message };
}

/** Deletes the account and its cloud copy, then signs out. The local log stays. */
export async function deleteMyAccount(client: SupabaseClient): Promise<AccountResult> {
  const { error } = await client.rpc("delete_my_account");
  if (error !== null) {
    return { ok: false, error: error.message };
  }
  // The user no longer exists, so only the local session needs clearing.
  const signedOut = await client.auth.signOut({ scope: "local" });
  return signedOut.error === null ? { ok: true } : { ok: false, error: signedOut.error.message };
}

function toAccountUser(user: User | undefined): AccountUser | undefined {
  if (user === undefined) {
    return undefined;
  }
  const avatarUrl: unknown = user.user_metadata.avatar_url;
  return {
    id: user.id,
    email: user.email ?? "",
    ...(typeof avatarUrl === "string" && avatarUrl !== "" && { avatarUrl }),
  };
}

/** Returns the AccountService backed by `client`: GitHub sign-in and the saves row's owner. */
export function createSupabaseAccountService(client: SupabaseClient): AccountService {
  return {
    onUserChange(listener) {
      // Fires once with the stored session, then on every sign-in, sign-out and token refresh.
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        listener(toAccountUser(session?.user));
      });
      return () => data.subscription.unsubscribe();
    },
    signIn: () => signInWithGitHub(client),
    signOut: () => signOut(client),
    deleteAccount: () => deleteMyAccount(client),
  };
}

const SAVES_TABLE = "saves";
// Postgres' unique_violation: the account's row already exists, so another device inserted first.
const UNIQUE_VIOLATION = "23505";

/**
 * Returns the signed-in user's saves row, parsed, or undefined before their first sync. Row Level
 * Security limits the table to that one row.
 */
export async function readSave(client: SupabaseClient): Promise<ReadSaveResult> {
  const { data, error } = await client
    .from(SAVES_TABLE)
    .select("entries, settings, version")
    .maybeSingle();
  if (error !== null) {
    return { ok: false, reason: "unreachable", error: error.message };
  }
  if (data === null) {
    return { ok: true, value: undefined };
  }
  const parsed = parseRemoteSave(data);
  return parsed.ok ? parsed : { ok: false, reason: "invalid", error: parsed.error };
}

/**
 * Inserts the row when `expectedVersion` is undefined, otherwise updates it only while it is still
 * at that version, bumping it. Returns "conflict" when another device wrote first.
 */
export async function writeSave(
  client: SupabaseClient,
  save: { entries: Entry[]; settings: Settings },
  expectedVersion: number | undefined,
): Promise<WriteSaveResult> {
  if (expectedVersion === undefined) {
    const { error } = await client.from(SAVES_TABLE).insert(save);
    if (error === null) {
      return { ok: true, value: "written" };
    }
    return error.code === UNIQUE_VIOLATION
      ? { ok: true, value: "conflict" }
      : { ok: false, reason: "unreachable", error: error.message };
  }
  const { data, error } = await client
    .from(SAVES_TABLE)
    .update({ ...save, version: expectedVersion + 1, updated_at: new Date().toISOString() })
    .eq("version", expectedVersion)
    .select("version");
  if (error !== null) {
    return { ok: false, reason: "unreachable", error: error.message };
  }
  return { ok: true, value: data.length === 0 ? "conflict" : "written" };
}

/** Returns the RemoteStore backed by `client`'s saves table. */
export function createSupabaseRemoteStore(client: SupabaseClient): RemoteStore {
  return {
    read: () => readSave(client),
    write: (save, expectedVersion) => writeSave(client, save, expectedVersion),
  };
}
