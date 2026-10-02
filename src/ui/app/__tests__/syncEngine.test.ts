// @vitest-environment jsdom
// jsdom for the window focus and visibility events the engine listens to.
import { afterEach, describe, expect, it, vi } from "vitest";

import type { SaveFile } from "@/domain/types";
import { aMasteredMark, anAttempt, aRemoteSave, aSaveFile } from "@/test/builders";
import { aFakeRemote, anInMemorySyncMetaStore, type FakeRemote } from "@/test/fakeRemoteStore";

import { createFileStore, type FileStore } from "../fileStore";
import { createSyncEngine, LOCAL_CHANGE_DEBOUNCE_MS, type SyncEngine } from "../syncEngine";

interface Device {
  fileStore: FileStore;
  engine: SyncEngine;
  read: ReturnType<typeof vi.spyOn>;
}

function aDevice(remote: FakeRemote, initialFile: SaveFile = aSaveFile()): Device {
  let savedFile = initialFile;
  const fileStore = createFileStore({
    load: () => savedFile,
    save(file) {
      savedFile = file;
    },
  });
  const read = vi.spyOn(remote.remoteStore, "read");
  const engine = createSyncEngine({
    fileStore,
    remoteStore: remote.remoteStore,
    syncMetaStore: anInMemorySyncMetaStore(),
  });
  return { fileStore, engine, read };
}

async function waitForStatus(engine: SyncEngine, status: string) {
  await vi.waitFor(() => expect(engine.getSnapshot().syncStatus.status).toBe(status));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("createSyncEngine", () => {
  it("starts as a pending first sync and reports synced when it ends", async () => {
    const device = aDevice(aFakeRemote());
    expect(device.engine.getSnapshot()).toEqual({
      syncStatus: { status: "syncing" },
      isFirstSyncPending: true,
    });

    device.engine.start();

    await waitForStatus(device.engine, "synced");
    expect(device.engine.getSnapshot().isFirstSyncPending).toBe(false);
  });

  it("runs once more, not twice, when asked to sync during a run", async () => {
    const remote = aFakeRemote();
    const releaseRead = remote.holdNextRead();
    const device = aDevice(remote);
    device.engine.start();

    device.engine.sync();
    device.engine.sync();
    releaseRead();

    await waitForStatus(device.engine, "synced");
    expect(device.read).toHaveBeenCalledTimes(2);
  });

  it("pauses on an invalid row and ignores later triggers", async () => {
    const device = aDevice(aFakeRemote({ entries: "not a log" }));
    device.engine.start();
    await waitForStatus(device.engine, "error");

    device.engine.sync();

    expect(device.read).toHaveBeenCalledTimes(1);
  });

  it("applies nothing from a run that was stopped mid-request", async () => {
    const remote = aFakeRemote(aRemoteSave({ entries: [aMasteredMark({ id: "remote" })] }));
    const releaseRead = remote.holdNextRead();
    const device = aDevice(remote, aSaveFile({ entries: [anAttempt({ id: "local" })] }));
    device.engine.start();

    device.engine.stop();
    releaseRead();
    await Promise.resolve();

    expect(device.fileStore.getFile().entries.map((entry) => entry.id)).toEqual(["local"]);
    expect(remote.writeCount).toBe(0);
  });

  it("schedules a sync for a change to the log but not for starting a timer", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const device = aDevice(aFakeRemote());
    device.engine.start();
    await waitForStatus(device.engine, "synced");

    device.fileStore.update((current) => ({
      ...current,
      activeTimer: { problemId: "two-sum", startedAt: "2026-10-01T10:00:00.000Z" },
    }));
    vi.advanceTimersByTime(LOCAL_CHANGE_DEBOUNCE_MS);
    expect(device.read).toHaveBeenCalledTimes(1);
    device.fileStore.update((current) => ({ ...current, entries: [anAttempt()] }));
    vi.advanceTimersByTime(LOCAL_CHANGE_DEBOUNCE_MS);

    await waitForStatus(device.engine, "synced");
    expect(device.read).toHaveBeenCalledTimes(2);
  });
});
