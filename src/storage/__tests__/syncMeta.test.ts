import { describe, expect, it } from "vitest";

import { DEFAULT_SETTINGS } from "@/domain/types";

import { createSyncMetaStore, SYNC_STORAGE_KEY } from "../syncMeta";

function aStorage(): Storage {
  const items = new Map<string, string>();
  const storage = {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  };
  return storage as unknown as Storage; // safe: the store only gets and sets items
}

describe("createSyncMetaStore", () => {
  it("reads as never synced on a new device", () => {
    const store = createSyncMetaStore(aStorage());

    expect(store.loadLastSyncedSettings()).toBeUndefined();
  });

  it("keeps the last synced settings across loads under dsa-learning:sync", () => {
    const storage = aStorage();
    createSyncMetaStore(storage).saveLastSyncedSettings(DEFAULT_SETTINGS);

    const reloaded = createSyncMetaStore(storage);

    expect(reloaded.loadLastSyncedSettings()).toEqual(DEFAULT_SETTINGS);
    expect(JSON.parse(storage.getItem(SYNC_STORAGE_KEY) ?? "")).toEqual({
      lastSyncedSettings: DEFAULT_SETTINGS,
    });
  });

  it("reads invalid stored data as never synced", () => {
    const storage = aStorage();
    storage.setItem(SYNC_STORAGE_KEY, "{not json");

    const store = createSyncMetaStore(storage);

    expect(store.loadLastSyncedSettings()).toBeUndefined();
  });
});
