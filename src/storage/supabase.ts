import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type { SupabaseClient };

export type AccountResult = { ok: true } | { ok: false; error: string };

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
