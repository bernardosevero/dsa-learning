import { reconcile } from "@/domain/sync";
import type { SaveFile } from "@/domain/types";
import type { RemoteStore } from "@/storage/remoteStore";
import type { SyncMetaStore } from "@/storage/syncMeta";

import type { FileChangeSource, FileStore } from "./fileStore";

export type SyncStatus =
  | { status: "signedOut" }
  | { status: "syncing" }
  | { status: "synced"; at: string }
  | { status: "offline"; lastSyncedAt?: string }
  | { status: "error" }; // the remote row failed validation: sync pauses, nothing is written

export interface SyncSnapshot {
  syncStatus: SyncStatus;
  /** True from sign-in until the first sync of this account has finished, however it ended. */
  isFirstSyncPending: boolean;
}

export interface SyncEngineOptions {
  fileStore: FileStore;
  remoteStore: RemoteStore;
  syncMetaStore: SyncMetaStore;
}

/** The sync of one signed-in account, shaped for useSyncExternalStore; no function uses `this`. */
export interface SyncEngine {
  getSnapshot: () => SyncSnapshot;
  subscribe: (listener: () => void) => () => void;
  /** Syncs now, then on window focus and 2 s after a local change, until stopped. */
  start: () => void;
  /** Syncs now, or once more when the run in progress ends. Does nothing once paused or stopped. */
  sync: () => void;
  /** Stops the triggers; a run in progress finishes without applying or reporting. */
  stop: () => void;
}

type EngineState =
  | { phase: "stopped" }
  | { phase: "idle" }
  | { phase: "running"; hasQueuedRun: boolean }
  | { phase: "paused" }; // the row is invalid: nothing is written until the next sign-in

type AttemptOutcome = SyncStatus | "conflict" | "stopped";

/** Another device writing between our read and write sends us back to read again, this often. */
const MAX_RETRIES = 2;
/** A burst of local changes syncs once, this long after the last one. */
export const LOCAL_CHANGE_DEBOUNCE_MS = 2000;

// Only the log and the settings sync, so starting a timer schedules nothing.
function isSyncedPartChanged(file: SaveFile, previous: SaveFile): boolean {
  return file.entries !== previous.entries || file.settings !== previous.settings;
}

/**
 * Returns the sync loop for one signed-in account: read the row, merge it into the local file,
 * write back only when the merge differs from the row, and retry when another device wrote first.
 */
export function createSyncEngine({
  fileStore,
  remoteStore,
  syncMetaStore,
}: SyncEngineOptions): SyncEngine {
  let state: EngineState = { phase: "stopped" };
  // Bumped by every start, so a run left over from before a stop never applies its result.
  let session = 0;
  let snapshot: SyncSnapshot = { syncStatus: { status: "syncing" }, isFirstSyncPending: true };
  let lastSyncedAt: string | undefined;
  let debounceTimeout: ReturnType<typeof setTimeout> | undefined;
  let unsubscribeFromFile: (() => void) | undefined;
  const listeners = new Set<() => void>();

  function report(syncStatus: SyncStatus, isFirstSyncPending: boolean) {
    snapshot = { syncStatus, isFirstSyncPending };
    for (const listener of listeners) {
      listener();
    }
  }

  function offline(): SyncStatus {
    return { status: "offline", lastSyncedAt };
  }

  async function attemptOnce(runSession: number): Promise<AttemptOutcome> {
    const read = await remoteStore.read();
    if (runSession !== session) {
      return "stopped";
    }
    if (!read.ok) {
      return read.reason === "invalid" ? { status: "error" } : offline();
    }
    const remote = read.value;
    // Read, merge and apply with no await in between, so no local change can slip past.
    const result = reconcile(fileStore.getFile(), remote, syncMetaStore.loadLastSyncedSettings());
    fileStore.update(() => result.file, "sync");
    if (result.toWrite === undefined) {
      syncMetaStore.saveLastSyncedSettings(result.file.settings);
      return { status: "synced", at: new Date().toISOString() };
    }
    const written = await remoteStore.write(result.toWrite, remote?.version);
    if (!written.ok) {
      return offline();
    }
    if (written.value === "conflict") {
      return "conflict";
    }
    syncMetaStore.saveLastSyncedSettings(result.toWrite.settings);
    return { status: "synced", at: new Date().toISOString() };
  }

  async function attemptWithRetries(runSession: number): Promise<SyncStatus | "stopped"> {
    let outcome: AttemptOutcome = "conflict";
    for (let attempt = 0; attempt <= MAX_RETRIES && outcome === "conflict"; attempt++) {
      outcome = await attemptOnce(runSession);
    }
    // Still conflicting after the retries: nothing is lost locally; the next trigger tries again.
    return outcome === "conflict" ? offline() : outcome;
  }

  async function run(): Promise<void> {
    const runSession = session;
    report({ status: "syncing" }, snapshot.isFirstSyncPending);
    let outcome: SyncStatus | "stopped";
    let hasQueuedRun: boolean;
    do {
      state = { phase: "running", hasQueuedRun: false };
      outcome = await attemptWithRetries(runSession);
      hasQueuedRun = state.phase === "running" && state.hasQueuedRun;
    } while (hasQueuedRun && outcome !== "stopped" && outcome.status !== "error");

    if (outcome === "stopped" || runSession !== session) {
      return;
    }
    if (outcome.status === "synced") {
      lastSyncedAt = outcome.at;
    }
    state = outcome.status === "error" ? { phase: "paused" } : { phase: "idle" };
    report(outcome, false);
  }

  function sync() {
    if (state.phase === "running") {
      state = { phase: "running", hasQueuedRun: true };
      return;
    }
    if (state.phase === "idle") {
      void run();
    }
  }

  function handleFocus() {
    sync();
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      sync();
    }
  }

  function handleFileChange(file: SaveFile, previous: SaveFile, source: FileChangeSource) {
    if (source === "sync" || !isSyncedPartChanged(file, previous)) {
      return;
    }
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(sync, LOCAL_CHANGE_DEBOUNCE_MS);
  }

  return {
    getSnapshot: () => snapshot,
    sync,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start() {
      session += 1;
      state = { phase: "idle" };
      unsubscribeFromFile = fileStore.subscribe(handleFileChange);
      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleVisibilityChange);
      sync();
    },
    stop() {
      session += 1;
      state = { phase: "stopped" };
      unsubscribeFromFile?.();
      clearTimeout(debounceTimeout);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    },
  };
}
