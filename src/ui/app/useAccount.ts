import { useEffect, useMemo, useState } from "react";

import type { AccountResult, AccountService, AccountUser } from "@/storage/accountService";

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

function toAccount(user: AccountUser | undefined): Account {
  if (user === undefined) {
    return { status: "signedOut" };
  }
  return {
    status: "signedIn",
    userId: user.id,
    email: user.email,
    ...(user.avatarUrl !== undefined && { avatarUrl: user.avatarUrl }),
  };
}

async function resolveUnavailable(): Promise<AccountResult> {
  return Promise.resolve(UNAVAILABLE);
}

/** Follows the signed-in user of `accountService`; without one, accounts are unavailable. */
export function useAccount(accountService: AccountService | undefined): AccountValue {
  const [account, setAccount] = useState<Account>(() =>
    accountService === undefined ? { status: "unavailable" } : { status: "signedOut" },
  );

  useEffect(() => {
    return accountService?.onUserChange((user) => setAccount(toAccount(user)));
  }, [accountService]);

  return useMemo<AccountValue>(() => {
    if (accountService === undefined) {
      return {
        account,
        signIn: resolveUnavailable,
        signOut: resolveUnavailable,
        deleteAccount: resolveUnavailable,
      };
    }
    return {
      account,
      signIn: () => accountService.signIn(),
      signOut: () => accountService.signOut(),
      deleteAccount: () => accountService.deleteAccount(),
    };
  }, [account, accountService]);
}
