import type { SaveFile } from "@/domain/types";

import { getBrowserStore, STORAGE_KEY } from "./localStore";

type UsageSharingListener = (isEnabled: boolean) => void;

const listeners = new Set<UsageSharingListener>();

/** Returns the saved anonymous-usage choice, without saving anything. Browser only. */
export function readUsageSharing(): boolean {
  return getBrowserStore().load().settings.shareAnonymousUsage;
}

/**
 * Saves the anonymous-usage choice into the latest save, keeping everything else in it, and
 * tells this document's subscribers when it changed. Browser only.
 */
export function setUsageSharing(isEnabled: boolean): void {
  const store = getBrowserStore();
  const latest = store.load();
  if (latest.settings.shareAnonymousUsage === isEnabled) {
    return;
  }
  store.save({ ...latest, settings: { ...latest.settings, shareAnonymousUsage: isEnabled } });
  for (const listener of listeners) {
    listener(isEnabled);
  }
}

/**
 * Calls `listener` with the choice when this document changes it, or when another tab changes or
 * clears the save. Returns the function that stops listening. Browser only.
 */
export function subscribeUsageSharing(listener: UsageSharingListener): () => void {
  // A null key means another tab cleared the whole storage.
  function handleStorage(event: StorageEvent) {
    if (event.key === null || event.key === STORAGE_KEY) {
      listener(readUsageSharing());
    }
  }

  listeners.add(listener);
  window.addEventListener("storage", handleStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * Saves `file` with the latest saved anonymous-usage choice in place of its own, so an older copy
 * of the save never restores a choice changed since. Tells no subscribers. Browser only.
 */
export function saveWithCurrentUsageSharing(file: Readonly<SaveFile>): void {
  const isEnabled = readUsageSharing();
  getBrowserStore().save({
    ...file,
    settings: { ...file.settings, shareAnonymousUsage: isEnabled },
  });
}
