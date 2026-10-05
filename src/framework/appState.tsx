import { useSyncExternalStore } from "react";

import { createBackend, type Backend } from "@/storage/backend";
import { AppLoading } from "@/ui/app/AppLoading";
import { PracticeApp } from "@/ui/app/PracticeApp";

let backend: Backend | undefined;
let isBackendCreated = false;

// Created on the first practice visit, never while prerendering, and shared by later visits.
function getBackend(): Backend | undefined {
  if (!isBackendCreated) {
    backend = createBackend();
    isBackendCreated = true;
  }
  return backend;
}

function subscribeToNothing(): () => void {
  return () => {};
}

function isOnClient(): boolean {
  return true;
}

function isOnServer(): boolean {
  return false;
}

/**
 * Layout route over every practice screen. The save lives in this browser, so the practice app
 * mounts only once the page runs on the client; the build and hydration render the fallback.
 */
export default function AppState() {
  const isHydrated = useSyncExternalStore(subscribeToNothing, isOnClient, isOnServer);
  if (!isHydrated) {
    return <AppLoading />;
  }
  const practiceBackend = getBackend();
  return (
    <PracticeApp
      accountService={practiceBackend?.accountService}
      remoteStore={practiceBackend?.remoteStore}
    />
  );
}
