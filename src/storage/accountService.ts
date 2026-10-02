import { createSupabase, createSupabaseAccountService } from "./supabase";

export type AccountResult = { ok: true } | { ok: false; error: string };

/** The signed-in user, as the app needs them, whatever backend holds the account. */
export interface AccountUser {
  id: string;
  email: string;
  avatarUrl?: string;
}

/** Signs a user in and out of their account. A backend (Supabase now) implements it. */
export interface AccountService {
  /** Calls `listener` with the current user (undefined when signed out) and on every change. */
  onUserChange(listener: (user: AccountUser | undefined) => void): () => void;
  signIn(): Promise<AccountResult>;
  signOut(): Promise<AccountResult>;
  /** Deletes the account and its cloud copy, then signs out. The local log stays. */
  deleteAccount(): Promise<AccountResult>;
}

/**
 * Returns the account service configured by the build's env vars, or undefined when they are
 * missing: the app then runs local-only, with no login anywhere.
 */
export function createAccountService(): AccountService | undefined {
  const client = createSupabase();
  return client === undefined ? undefined : createSupabaseAccountService(client);
}
