import { useEffect, useMemo, useState } from "react";

import type { User } from "@supabase/supabase-js";

import {
  deleteMyAccount,
  signInWithGitHub,
  signOut,
  type AccountResult,
  type SupabaseClient,
} from "@/storage/supabase";

export type Account =
  | { status: "unavailable" } // env vars missing: no login UI anywhere
  | { status: "signedOut" }
  | { status: "signedIn"; userId: string; email: string; avatarUrl?: string };

export interface AccountValue {
  account: Account;
  signIn: () => Promise<AccountResult>;
  signOut: () => Promise<AccountResult>;
  deleteAccount: () => Promise<AccountResult>;
}

const UNAVAILABLE: AccountResult = { ok: false, error: "Accounts aren't available here." };

function toAccount(user: User | undefined): Account {
  if (user === undefined) {
    return { status: "signedOut" };
  }
  const avatarUrl: unknown = user.user_metadata.avatar_url;
  return {
    status: "signedIn",
    userId: user.id,
    email: user.email ?? "",
    ...(typeof avatarUrl === "string" && avatarUrl !== "" && { avatarUrl }),
  };
}

async function resolveUnavailable(): Promise<AccountResult> {
  return Promise.resolve(UNAVAILABLE);
}

/** Follows the signed-in user of `client`; without a client, accounts are unavailable. */
export function useAccount(client: SupabaseClient | undefined): AccountValue {
  const [account, setAccount] = useState<Account>(() =>
    client === undefined ? { status: "unavailable" } : { status: "signedOut" },
  );

  useEffect(() => {
    if (client === undefined) {
      return;
    }
    // Fires once with the stored session, then on every sign-in, sign-out and token refresh.
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setAccount(toAccount(session?.user));
    });
    return () => data.subscription.unsubscribe();
  }, [client]);

  return useMemo<AccountValue>(() => {
    if (client === undefined) {
      return {
        account,
        signIn: resolveUnavailable,
        signOut: resolveUnavailable,
        deleteAccount: resolveUnavailable,
      };
    }
    return {
      account,
      signIn: () => signInWithGitHub(client),
      signOut: () => signOut(client),
      deleteAccount: () => deleteMyAccount(client),
    };
  }, [account, client]);
}
