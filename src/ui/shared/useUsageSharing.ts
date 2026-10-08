import { useState, useSyncExternalStore } from "react";

export interface UsageSharingState {
  readonly isEnabled: boolean | undefined;
  readonly setEnabled: (isEnabled: boolean) => void;
}

interface UsageSharingSource {
  getSnapshot: () => boolean | undefined;
  subscribe: (onChange: () => void) => () => void;
}

// Loaded on demand: the storage module carries the save file's parser, which public pages would
// otherwise download before their first paint.
function loadUsageSharingStorage() {
  return import("@/storage/usageSharing");
}

function setUsageSharingWhenLoaded(isEnabled: boolean): void {
  void loadUsageSharingStorage().then((storage) => {
    storage.setUsageSharing(isEnabled);
  });
}

// Storage is read only once React subscribes, after the first render has committed, so the
// server and the first browser render both see undefined.
function createUsageSharingSource(): UsageSharingSource {
  let isEnabled: boolean | undefined;
  return {
    getSnapshot: () => isEnabled,
    subscribe(onChange) {
      let isSubscribed = true;
      let unsubscribe: (() => void) | undefined;
      void loadUsageSharingStorage().then((storage) => {
        if (!isSubscribed) {
          return;
        }
        unsubscribe = storage.subscribeUsageSharing((isNowEnabled) => {
          isEnabled = isNowEnabled;
          onChange();
        });
        isEnabled = storage.readUsageSharing();
        onChange();
      });
      return () => {
        isSubscribed = false;
        unsubscribe?.();
      };
    },
  };
}

/**
 * Returns the saved anonymous-usage choice and its setter, for pages outside AppData. The choice
 * is undefined on the server and in the first browser render, until storage has been read.
 */
export function useUsageSharing(): UsageSharingState {
  const [source] = useState(createUsageSharingSource);
  const isEnabled = useSyncExternalStore(source.subscribe, source.getSnapshot, source.getSnapshot);
  return { isEnabled, setEnabled: setUsageSharingWhenLoaded };
}
