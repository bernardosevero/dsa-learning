import type { SaveFile } from "@/domain/types";
import type { Store } from "@/storage/localStore";

/**
 * Who changed the file: the user through an action, a sync applying the account's copy, or
 * storage, when another page already saved the change and this copy only catches up.
 */
export type FileChangeSource = "user" | "sync" | "storage";

export type FileListener = (file: SaveFile, previous: SaveFile, source: FileChangeSource) => void;

/**
 * The save file in memory, saved on every change; React and the sync engine both read it here.
 * Its functions don't use `this`, so they can be passed around on their own.
 */
export interface FileStore {
  getFile: () => SaveFile;
  /**
   * Replaces the file with `change(current)`, saves it and tells the listeners, all at once. A
   * change from storage is already saved, so it is not saved again.
   */
  update: (change: (current: SaveFile) => SaveFile, source?: FileChangeSource) => void;
  subscribe: (listener: FileListener) => () => void;
}

/** Returns a FileStore over `store`, loaded once now. A change that returns the same file is a no-op. */
export function createFileStore(store: Store): FileStore {
  let file = store.load();
  const listeners = new Set<FileListener>();

  return {
    getFile: () => file,
    update(change, source = "user") {
      const previous = file;
      const next = change(previous);
      if (next === previous) {
        return;
      }
      file = next;
      if (source !== "storage") {
        store.save(next);
      }
      for (const listener of listeners) {
        listener(next, previous, source);
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
