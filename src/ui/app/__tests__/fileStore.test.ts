import { describe, expect, it, vi } from "vitest";

import type { SaveFile } from "@/domain/types";
import type { Store } from "@/storage/localStore";
import { anAttempt, aSaveFile } from "@/test/builders";

import { createFileStore } from "../fileStore";

function aStore(initialFile: SaveFile = aSaveFile()): Store & { saved: SaveFile[] } {
  const saved: SaveFile[] = [];
  return { saved, load: () => initialFile, save: (file) => void saved.push(file) };
}

describe("createFileStore", () => {
  it("loads the file once, when created", () => {
    const loaded = aSaveFile({ entries: [anAttempt()] });

    const fileStore = createFileStore(aStore(loaded));

    expect(fileStore.getFile()).toBe(loaded);
  });

  it("saves a change and tells the listeners who made it", () => {
    const store = aStore();
    const fileStore = createFileStore(store);
    const listener = vi.fn();
    fileStore.subscribe(listener);
    const before = fileStore.getFile();

    fileStore.update((current) => ({ ...current, entries: [anAttempt()] }), "sync");

    expect(store.saved).toEqual([fileStore.getFile()]);
    expect(listener).toHaveBeenCalledWith(fileStore.getFile(), before, "sync");
  });

  it("treats a change returning the same file as no change", () => {
    const store = aStore();
    const fileStore = createFileStore(store);
    const listener = vi.fn();
    fileStore.subscribe(listener);

    fileStore.update((current) => current);

    expect(store.saved).toEqual([]);
    expect(listener).not.toHaveBeenCalled();
  });
});
