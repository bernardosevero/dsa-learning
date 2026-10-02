import { z } from "zod";

import type { Settings } from "@/domain/types";

import { settingsSchema } from "./saveFile";

/** Where sync keeps its own state, outside the save file so the export format doesn't change. */
export const SYNC_STORAGE_KEY = "dsa-learning:sync";

/** What sync remembers between runs on this device. */
export interface SyncMetaStore {
  /** The settings both sides held after the last sync, for the three-way settings rule. */
  loadLastSyncedSettings(): Settings | undefined;
  saveLastSyncedSettings(settings: Settings): void;
}

const syncMetaSchema = z.object({ lastSyncedSettings: settingsSchema });

function resolveStorage(storage: Storage | undefined): Storage | undefined {
  if (storage !== undefined) {
    return storage;
  }
  try {
    return window.localStorage;
  } catch {
    // Storage blocked by the browser: sync still works, as a first sync on every load.
    return undefined;
  }
}

function readLastSyncedSettings(storage: Storage | undefined): Settings | undefined {
  try {
    const parsed = syncMetaSchema.safeParse(JSON.parse(storage?.getItem(SYNC_STORAGE_KEY) ?? ""));
    return parsed.success ? parsed.data.lastSyncedSettings : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Returns a SyncMetaStore over `storage` (default: window.localStorage). Missing or invalid data
 * reads as never synced, which only makes the account's settings win once.
 */
export function createSyncMetaStore(storage?: Storage): SyncMetaStore {
  const backingStorage = resolveStorage(storage);
  // The latest save, so this session stays right even when storage refuses to write.
  let savedThisSession: Settings | undefined;

  return {
    loadLastSyncedSettings() {
      return savedThisSession ?? readLastSyncedSettings(backingStorage);
    },
    saveLastSyncedSettings(settings) {
      savedThisSession = settings;
      try {
        backingStorage?.setItem(SYNC_STORAGE_KEY, JSON.stringify({ lastSyncedSettings: settings }));
      } catch {
        // Full or blocked storage: the next load is a first sync for settings, which is safe.
      }
    },
  };
}
