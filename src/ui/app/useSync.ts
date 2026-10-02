import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { reconcile } from "@/domain/sync";
import type { SaveFile } from "@/domain/types";
import type { RemoteStore } from "@/storage/remoteStore";
import type { SyncMetaStore } from "@/storage/syncMeta";

import type { Account } from "./useAccount";

export type SyncStatus =
  | { status: "signedOut" }
  | { status: "syncing" }
  | { status: "synced"; at: string }
  | { status: "offline"; lastSyncedAt?: string }
  | { status: "error" }; // the remote row failed validation: sync pauses, nothing is written

export interface SyncValue {
  syncStatus: SyncStatus;
  /** True from sign-in until the first sync of this account has finished, however it ended. */
  isFirstSyncPending: boolean;
}

export interface UseSyncOptions {
  account: Account;
  remoteStore: RemoteStore | undefined;
  syncMetaStore: SyncMetaStore;
  file: SaveFile;
  setFile: Dispatch<SetStateAction<SaveFile>>;
}

/** Another device writing between our read and write sends us back to read again, this often. */
const MAX_RETRIES = 2;
/** A burst of local changes syncs once, this long after the last one. */
export const LOCAL_CHANGE_DEBOUNCE_MS = 2000;

const SIGNED_OUT: SyncStatus = { status: "signedOut" };

type RunOutcome = SyncStatus | "conflict";

/**
 * Keeps the local file and the account's copy in step for a signed-in account: on sign-in and
 * load, when the window regains focus, and 2 s after a local change. It writes only when the
 * merged result differs from the row, so applying a sync never triggers another write.
 */
export function useSync({
  account,
  remoteStore,
  syncMetaStore,
  file,
  setFile,
}: UseSyncOptions): SyncValue {
  const userId = account.status === "signedIn" ? account.userId : undefined;
  const [status, setStatus] = useState<SyncStatus>(SIGNED_OUT);
  const [firstSyncedUserId, setFirstSyncedUserId] = useState<string | undefined>();

  const fileRef = useRef(file);
  // The file a sync last applied, so the change it causes isn't taken for a local edit.
  const appliedFileRef = useRef<SaveFile | undefined>(undefined);
  const lastSyncedAtRef = useRef<string | undefined>(undefined);
  const isRunningRef = useRef(false);
  const hasRerunRef = useRef(false);
  const isPausedRef = useRef(false);
  // Bumped on every account change, so a run that outlives its account drops its result.
  const generationRef = useRef(0);

  useEffect(() => {
    fileRef.current = file;
  }, [file]);

  const syncOnce = useCallback(
    async (store: RemoteStore): Promise<RunOutcome> => {
      const read = await store.read();
      if (!read.ok) {
        return read.reason === "invalid"
          ? { status: "error" }
          : { status: "offline", lastSyncedAt: lastSyncedAtRef.current };
      }
      const remote = read.value;
      const lastSyncedSettings = syncMetaStore.loadLastSyncedSettings();
      const result = reconcile(fileRef.current, remote, lastSyncedSettings);
      // The updater merges into the latest state, so a change made during the request is kept.
      setFile((current) => {
        const next = reconcile(current, remote, lastSyncedSettings).file;
        appliedFileRef.current = next;
        return next;
      });
      if (result.toWrite === undefined) {
        syncMetaStore.saveLastSyncedSettings(result.file.settings);
        return { status: "synced", at: new Date().toISOString() };
      }
      const written = await store.write(result.toWrite, remote?.version);
      if (!written.ok) {
        return { status: "offline", lastSyncedAt: lastSyncedAtRef.current };
      }
      if (written.value === "conflict") {
        return "conflict";
      }
      syncMetaStore.saveLastSyncedSettings(result.toWrite.settings);
      return { status: "synced", at: new Date().toISOString() };
    },
    [setFile, syncMetaStore],
  );

  const runOnce = useCallback(
    async (store: RemoteStore): Promise<SyncStatus> => {
      let outcome: RunOutcome = "conflict";
      for (let attempt = 0; attempt <= MAX_RETRIES && outcome === "conflict"; attempt++) {
        outcome = await syncOnce(store);
      }
      // Still conflicting after the retries: nothing is lost locally; the next trigger tries again.
      return outcome === "conflict"
        ? { status: "offline", lastSyncedAt: lastSyncedAtRef.current }
        : outcome;
    },
    [syncOnce],
  );

  const runSync = useCallback(async () => {
    if (remoteStore === undefined || userId === undefined || isPausedRef.current) {
      return;
    }
    // A trigger during a run makes the run go once more when it ends, instead of overlapping.
    if (isRunningRef.current) {
      hasRerunRef.current = true;
      return;
    }
    const generation = generationRef.current;
    isRunningRef.current = true;
    setStatus({ status: "syncing" });
    let finalStatus: SyncStatus;
    do {
      hasRerunRef.current = false;
      finalStatus = await runOnce(remoteStore);
    } while (hasRerunRef.current && finalStatus.status !== "error");
    // A run that outlived its account leaves the running flag to the new account's run.
    if (generation !== generationRef.current) {
      return;
    }
    isRunningRef.current = false;
    if (finalStatus.status === "synced") {
      lastSyncedAtRef.current = finalStatus.at;
    }
    isPausedRef.current = finalStatus.status === "error";
    setStatus(finalStatus);
    setFirstSyncedUserId(userId);
  }, [remoteStore, userId, runOnce]);

  // Sign-in and app load: a new account starts from scratch and syncs at once.
  useEffect(() => {
    generationRef.current += 1;
    isRunningRef.current = false;
    hasRerunRef.current = false;
    isPausedRef.current = false;
    lastSyncedAtRef.current = undefined;
    void runSync();
  }, [runSync]);

  useEffect(() => {
    function handleFocus() {
      void runSync();
    }
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void runSync();
      }
    }
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [runSync]);

  useDebouncedLocalChange(file, appliedFileRef, runSync);

  if (userId === undefined || remoteStore === undefined) {
    return { syncStatus: SIGNED_OUT, isFirstSyncPending: false };
  }
  return { syncStatus: status, isFirstSyncPending: firstSyncedUserId !== userId };
}

// Only the log and the settings sync, so a timer start or a sync's own apply schedules nothing.
function useDebouncedLocalChange(
  file: SaveFile,
  appliedFileRef: Readonly<{ current: SaveFile | undefined }>,
  runSync: () => Promise<void>,
): void {
  const lastSeenRef = useRef(file);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const lastSeen = lastSeenRef.current;
    lastSeenRef.current = file;
    const isSyncedPartUnchanged =
      file.entries === lastSeen.entries && file.settings === lastSeen.settings;
    if (isSyncedPartUnchanged || file === appliedFileRef.current) {
      return;
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => void runSync(), LOCAL_CHANGE_DEBOUNCE_MS);
  }, [file, appliedFileRef, runSync]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);
}
