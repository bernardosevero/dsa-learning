import type { RemoteSave } from "@/domain/sync";
import type { Settings } from "@/domain/types";
import { parseRemoteSave, type RemoteStore } from "@/storage/remoteStore";
import type { SyncMetaStore } from "@/storage/syncMeta";

/** One account's saves row in memory, with the version check, shared by any number of devices. */
export interface FakeRemote {
  remoteStore: RemoteStore;
  /** The row as stored, or undefined before the first write. */
  readonly row: unknown;
  /** How many writes changed the row. */
  readonly writeCount: number;
  /** Makes every request fail as if the network were down, until set back to false. */
  setOffline(isOffline: boolean): void;
  /** Runs `action` once, just before the next write lands: another device writing first. */
  beforeNextWrite(action: () => void): void;
  /** Holds the next read until the returned function is called. */
  holdNextRead(): () => void;
  /** Writes the row directly, the way another device's successful write would. */
  writeDirectly(save: Omit<RemoteSave, "version">): void;
}

const UNREACHABLE = { ok: false, reason: "unreachable", error: "Failed to fetch" } as const;

// Through JSON, as the row is, so no device shares objects with another.
function copyThroughJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T; // safe: a JSON round trip keeps the shape
}

function versionOf(row: unknown): number | undefined {
  const parsed = parseRemoteSave(row);
  return parsed.ok ? parsed.value.version : undefined;
}

/** Returns a fake account row, starting as `initialRow` (anything, to test invalid rows). */
export function aFakeRemote(initialRow?: unknown): FakeRemote {
  let row: unknown = initialRow === undefined ? undefined : copyThroughJson(initialRow);
  let writeCount = 0;
  let isOffline = false;
  let pendingBeforeWrite: (() => void) | undefined;
  let heldRead: Promise<void> | undefined;

  function writeRow(save: Omit<RemoteSave, "version">, version: number) {
    row = copyThroughJson({ ...save, version });
    writeCount += 1;
  }

  const remoteStore: RemoteStore = {
    async read() {
      const hold = heldRead;
      heldRead = undefined;
      await hold;
      if (isOffline) {
        return UNREACHABLE;
      }
      if (row === undefined) {
        return { ok: true, value: undefined };
      }
      const parsed = parseRemoteSave(copyThroughJson(row));
      return parsed.ok ? parsed : { ok: false, reason: "invalid", error: parsed.error };
    },
    async write(save, expectedVersion) {
      await Promise.resolve();
      if (isOffline) {
        return UNREACHABLE;
      }
      const beforeWrite = pendingBeforeWrite;
      pendingBeforeWrite = undefined;
      beforeWrite?.();
      const isInsert = expectedVersion === undefined;
      const isCurrent = isInsert ? row === undefined : versionOf(row) === expectedVersion;
      if (!isCurrent) {
        return { ok: true, value: "conflict" };
      }
      writeRow(save, isInsert ? 1 : expectedVersion + 1);
      return { ok: true, value: "written" };
    },
  };

  return {
    remoteStore,
    get row() {
      return row;
    },
    get writeCount() {
      return writeCount;
    },
    setOffline(isNowOffline) {
      isOffline = isNowOffline;
    },
    beforeNextWrite(action) {
      pendingBeforeWrite = action;
    },
    holdNextRead() {
      let release: () => void = () => undefined;
      heldRead = new Promise<void>((resolve) => {
        release = resolve;
      });
      return release;
    },
    writeDirectly(save) {
      writeRow(save, (versionOf(row) ?? 0) + 1);
    },
  };
}

/** A SyncMetaStore in memory: one per fake device. */
export function anInMemorySyncMetaStore(): SyncMetaStore {
  let lastSyncedSettings: Settings | undefined;
  return {
    loadLastSyncedSettings: () => lastSyncedSettings,
    saveLastSyncedSettings(settings) {
      lastSyncedSettings = settings;
    },
  };
}
