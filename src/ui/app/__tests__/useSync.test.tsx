import { act, renderHook, waitFor } from "@testing-library/react";
import { useSyncExternalStore } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Entry, SaveFile } from "@/domain/types";
import type { Store } from "@/storage/localStore";
import { parseRemoteSave } from "@/storage/remoteStore";
import { aMasteredMark, anAttempt, aRemoteSave, aSaveFile } from "@/test/builders";
import { aFakeRemote, anInMemorySyncMetaStore, type FakeRemote } from "@/test/fakeRemoteStore";

import { resetProgressEverywhere } from "../appDataReducers";
import { createFileStore } from "../fileStore";
import { LOCAL_CHANGE_DEBOUNCE_MS } from "../syncEngine";
import type { Account } from "../useAccount";
import { useSync } from "../useSync";

const SIGNED_IN: Account = { status: "signedIn", userId: "user-1", email: "ada@example.com" };

function anInMemoryStore(initialFile: SaveFile): Store {
  let savedFile = initialFile;
  return {
    load: () => savedFile,
    save(file) {
      savedFile = file;
    },
  };
}

// One browser: its own local file and sync metadata, signed into the shared fake account row.
function renderDevice(remote: FakeRemote, initialFile: SaveFile = aSaveFile()) {
  const fileStore = createFileStore(anInMemoryStore(initialFile));
  const syncMetaStore = anInMemorySyncMetaStore();
  return renderHook(() => {
    const file = useSyncExternalStore(fileStore.subscribe, fileStore.getFile);
    const sync = useSync({
      account: SIGNED_IN,
      fileStore,
      remoteStore: remote.remoteStore,
      syncMetaStore,
    });
    return { file, setFile: fileStore.update, ...sync };
  });
}

function idsOf(entries: readonly Entry[]): string[] {
  return entries.map((entry) => entry.id).toSorted();
}

function rowEntryIds(remote: FakeRemote): string[] {
  const parsed = parseRemoteSave(remote.row);
  return parsed.ok ? idsOf(parsed.value.entries) : [];
}

async function waitUntilSynced(device: { current: { syncStatus: { status: string } } }) {
  await waitFor(() => expect(device.current.syncStatus.status).toBe("synced"));
}

function focusWindow() {
  act(() => {
    window.dispatchEvent(new Event("focus"));
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useSync", () => {
  it("two devices with different entries end up with the same log", async () => {
    const remote = aFakeRemote();
    const laptop = renderDevice(remote, aSaveFile({ entries: [anAttempt({ id: "on-laptop" })] }));
    await waitUntilSynced(laptop.result);
    const phone = renderDevice(remote, aSaveFile({ entries: [aMasteredMark({ id: "on-phone" })] }));
    await waitUntilSynced(phone.result);

    focusWindow();

    await waitFor(() => expect(idsOf(laptop.result.current.file.entries)).toHaveLength(2));
    expect(idsOf(laptop.result.current.file.entries)).toEqual(["on-laptop", "on-phone"]);
    expect(idsOf(phone.result.current.file.entries)).toEqual(["on-laptop", "on-phone"]);
    expect(rowEntryIds(remote)).toEqual(["on-laptop", "on-phone"]);
  });

  it("retries after another device wrote first", async () => {
    const remote = aFakeRemote(aRemoteSave({ entries: [anAttempt({ id: "already-there" })] }));
    remote.beforeNextWrite(() => {
      remote.writeDirectly({
        entries: [anAttempt({ id: "already-there" }), aMasteredMark({ id: "from-other-device" })],
        settings: aSaveFile().settings,
      });
    });

    const device = renderDevice(remote, aSaveFile({ entries: [anAttempt({ id: "local" })] }));

    await waitUntilSynced(device.result);
    expect(rowEntryIds(remote)).toEqual(["already-there", "from-other-device", "local"]);
    expect(idsOf(device.result.current.file.entries)).toEqual([
      "already-there",
      "from-other-device",
      "local",
    ]);
  });

  it("an attempt logged during a sync is kept", async () => {
    const remote = aFakeRemote(aRemoteSave({ entries: [aMasteredMark({ id: "remote" })] }));
    const releaseRead = remote.holdNextRead();
    const device = renderDevice(remote);
    await waitFor(() => expect(device.result.current.syncStatus.status).toBe("syncing"));

    act(() => {
      device.result.current.setFile((current) => ({
        ...current,
        entries: [...current.entries, anAttempt({ id: "logged-mid-sync" })],
      }));
    });
    releaseRead();

    await waitUntilSynced(device.result);
    expect(idsOf(device.result.current.file.entries)).toEqual(["logged-mid-sync", "remote"]);
  });

  it("syncs a local change 2 s after it", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const remote = aFakeRemote();
    const device = renderDevice(remote);
    await waitUntilSynced(device.result);

    act(() => {
      device.result.current.setFile((current) => ({ ...current, entries: [anAttempt()] }));
    });
    act(() => {
      vi.advanceTimersByTime(LOCAL_CHANGE_DEBOUNCE_MS);
    });

    await waitFor(() => expect(rowEntryIds(remote)).toEqual(["attempt-1"]));
  });

  it("writes nothing on a sync that brings nothing new", async () => {
    const remote = aFakeRemote();
    const device = renderDevice(remote, aSaveFile({ entries: [anAttempt()] }));
    await waitUntilSynced(device.result);
    const writesAfterFirstSync = remote.writeCount;

    focusWindow();
    await waitUntilSynced(device.result);
    focusWindow();
    await waitUntilSynced(device.result);

    expect(writesAfterFirstSync).toBe(1);
    expect(remote.writeCount).toBe(1);
  });

  it("reports offline when the request fails and syncs on the next trigger", async () => {
    const remote = aFakeRemote();
    remote.setOffline(true);
    const device = renderDevice(remote, aSaveFile({ entries: [anAttempt()] }));
    await waitFor(() => expect(device.result.current.syncStatus.status).toBe("offline"));
    expect(device.result.current.isFirstSyncPending).toBe(false);

    remote.setOffline(false);
    focusWindow();

    await waitUntilSynced(device.result);
    expect(rowEntryIds(remote)).toEqual(["attempt-1"]);
  });

  it("pauses with an error and writes nothing when the row is invalid", async () => {
    const remote = aFakeRemote({ entries: "not a log", settings: {}, version: 1 });
    const device = renderDevice(remote, aSaveFile({ entries: [anAttempt()] }));
    await waitFor(() => expect(device.result.current.syncStatus.status).toBe("error"));

    focusWindow();

    expect(device.result.current.syncStatus.status).toBe("error");
    expect(remote.writeCount).toBe(0);
    expect(remote.row).toEqual({ entries: "not a log", settings: {}, version: 1 });
  });

  it("a signed-in reset stays reset after the other device syncs", async () => {
    const remote = aFakeRemote();
    const entries = [anAttempt({ id: "a" }), aMasteredMark({ id: "b" })];
    const laptop = renderDevice(remote, aSaveFile({ entries }));
    await waitUntilSynced(laptop.result);
    const phone = renderDevice(remote);
    await waitUntilSynced(phone.result);
    expect(idsOf(phone.result.current.file.entries)).toEqual(["a", "b"]);

    act(() => {
      laptop.result.current.setFile(resetProgressEverywhere);
    });
    focusWindow();
    await waitUntilSynced(laptop.result);
    focusWindow();
    await waitUntilSynced(phone.result);

    for (const device of [laptop, phone]) {
      expect(device.result.current.file.entries.every((entry) => entry.deletedAt)).toBe(true);
    }
  });
});
