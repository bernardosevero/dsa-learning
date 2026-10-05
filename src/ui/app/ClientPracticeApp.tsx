import { useSyncExternalStore } from "react";

import { createBackend, type Backend } from "@/storage/backend";

import { AppLoading } from "./AppLoading";
import { PracticeApp } from "./PracticeApp";

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
 * The practice app with the build's backend, mounted only once the page runs in the browser: the
 * save lives there, so the build and hydration render the loading fallback instead.
 */
export function ClientPracticeApp() {
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
