import type { AccountService } from "./accountService";
import type { RemoteStore } from "./remoteStore";
import {
  createSupabase,
  createSupabaseAccountService,
  createSupabaseRemoteStore,
} from "./supabase";

/** The cloud side of the app: who is signed in, and their copy of the log. */
export interface Backend {
  accountService: AccountService;
  remoteStore: RemoteStore;
}

/**
 * Returns the backend configured by the build's env vars, or undefined when they are missing: the
 * app then runs local-only, with no login anywhere.
 */
export function createBackend(): Backend | undefined {
  const client = createSupabase();
  if (client === undefined) {
    return undefined;
  }
  return {
    accountService: createSupabaseAccountService(client),
    remoteStore: createSupabaseRemoteStore(client),
  };
}
