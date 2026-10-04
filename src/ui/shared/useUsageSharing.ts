import { useState, useSyncExternalStore } from "react";

import { readUsageSharing, setUsageSharing, subscribeUsageSharing } from "@/storage/usageSharing";

export interface UsageSharingState {
  readonly isEnabled: boolean | undefined;
  readonly setEnabled: (isEnabled: boolean) => void;
}

interface UsageSharingSource {
  getSnapshot: () => boolean | undefined;
  subscribe: (onChange: () => void) => () => void;
}

// Storage is read only once React subscribes, after the first render has committed, so the
// server and the first browser render both see undefined.
function createUsageSharingSource(): UsageSharingSource {
  let isEnabled: boolean | undefined;
  return {
    getSnapshot: () => isEnabled,
    subscribe(onChange) {
      const unsubscribe = subscribeUsageSharing((isNowEnabled) => {
        isEnabled = isNowEnabled;
        onChange();
      });
      isEnabled = readUsageSharing();
      onChange();
      return unsubscribe;
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
  return { isEnabled, setEnabled: setUsageSharing };
}
