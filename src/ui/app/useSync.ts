import { useEffect, useMemo, useSyncExternalStore } from "react";

import type { RemoteStore } from "@/storage/remoteStore";
import type { SyncMetaStore } from "@/storage/syncMeta";

import type { FileStore } from "./fileStore";
import { createSyncEngine, type SyncSnapshot, type SyncStatus } from "./syncEngine";
import type { Account } from "./useAccount";

export type { SyncStatus };
export type SyncValue = SyncSnapshot;

export interface UseSyncOptions {
  account: Account;
  fileStore: FileStore;
  remoteStore: RemoteStore | undefined;
  syncMetaStore: SyncMetaStore;
}

const SIGNED_OUT: SyncSnapshot = { syncStatus: { status: "signedOut" }, isFirstSyncPending: false };

function getSignedOutSnapshot(): SyncSnapshot {
  return SIGNED_OUT;
}

function subscribeToNothing(): () => void {
  return () => undefined;
}

/** Runs one sync engine per signed-in account (see createSyncEngine) and reports its status. */
export function useSync({
  account,
  fileStore,
  remoteStore,
  syncMetaStore,
}: UseSyncOptions): SyncValue {
  const userId = account.status === "signedIn" ? account.userId : undefined;

  // A new engine per account, so a new account starts from scratch.
  const engine = useMemo(
    () =>
      userId === undefined || remoteStore === undefined
        ? undefined
        : createSyncEngine({ fileStore, remoteStore, syncMetaStore }),
    [userId, fileStore, remoteStore, syncMetaStore],
  );

  useEffect(() => {
    engine?.start();
    return () => engine?.stop();
  }, [engine]);

  return useSyncExternalStore(
    engine?.subscribe ?? subscribeToNothing,
    engine?.getSnapshot ?? getSignedOutSnapshot,
  );
}
