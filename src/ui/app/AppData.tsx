import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { PROBLEMS } from "@/data/problems";
import { today } from "@/domain/dates";
import { deriveAllStates } from "@/domain/schedule";
import type { LocalDate, Problem, ProblemState, SaveFile, Settings } from "@/domain/types";
import { getBrowserStore, importJson, type Store } from "@/storage/localStore";
import type { AccountService } from "@/storage/accountService";
import type { RemoteStore } from "@/storage/remoteStore";
import { createSyncMetaStore, type SyncMetaStore } from "@/storage/syncMeta";
import {
  saveWithCurrentUsageSharing,
  setUsageSharing,
  subscribeUsageSharing,
} from "@/storage/usageSharing";

import * as reducers from "./appDataReducers";
import { createFileStore, type FileChangeSource, type FileStore } from "./fileStore";
import type { NewAttempt } from "./appDataReducers";
import { useAccount, type AccountValue } from "./useAccount";
import { useSync, type SyncValue } from "./useSync";

export interface AppDataValue extends AccountValue, SyncValue {
  problems: readonly Problem[];
  file: SaveFile;
  /** Derived from the log on every change; never stored. */
  states: Readonly<Record<string, ProblemState>>;
  todayDate: LocalDate;
  addAttempt: (attempt: NewAttempt) => void;
  markMastered: (problemId: string) => void;
  deleteEntry: (entryId: string) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  startTimer: (problemId: string) => void;
  restartTimer: (problemId: string) => void;
  clearTimer: () => void;
  importText: (text: string) => ReturnType<typeof importJson>;
  resetProgress: () => void;
}

const AppDataContext = createContext<AppDataValue | undefined>(undefined);

// Loads through the document's one Store, created on first load, and never saves over a newer
// usage-sharing choice made outside this provider (the public Privacy page, another tab).
const appStore: Store = {
  load: () => getBrowserStore().load(),
  save: saveWithCurrentUsageSharing,
};
let syncMetaStore: SyncMetaStore | undefined;
const PROBLEM_IDS = PROBLEMS.map((problem) => problem.id);

// Created on first use in the browser, not when the module loads during the build.
function getSyncMetaStore(): SyncMetaStore {
  syncMetaStore ??= createSyncMetaStore();
  return syncMetaStore;
}

// The app can stay open past midnight, so the day is re-read whenever the user comes back.
function useTodayDate(): LocalDate {
  const [todayDate, setTodayDate] = useState(() => today());
  useEffect(() => {
    function handleReturn() {
      setTodayDate(today());
    }
    window.addEventListener("focus", handleReturn);
    document.addEventListener("visibilitychange", handleReturn);
    return () => {
      window.removeEventListener("focus", handleReturn);
      document.removeEventListener("visibilitychange", handleReturn);
    };
  }, []);
  return todayDate;
}

// A choice changed elsewhere is already saved; only this copy of the file catches up.
function useUsageSharingFromStorage(fileStore: FileStore): void {
  useEffect(() => {
    function handleUsageSharingChange(isEnabled: boolean) {
      fileStore.update(
        (current) =>
          current.settings.shareAnonymousUsage === isEnabled
            ? current
            : reducers.updateSettings(current, { shareAnonymousUsage: isEnabled }),
        "storage",
      );
    }
    return subscribeUsageSharing(handleUsageSharingChange);
  }, [fileStore]);
}

// A sync can bring the account's choice; it becomes this browser's saved choice too.
function useUsageSharingFromSync(fileStore: FileStore): void {
  useEffect(() => {
    function handleFileChange(file: SaveFile, previous: SaveFile, source: FileChangeSource) {
      const isEnabled = file.settings.shareAnonymousUsage;
      if (source === "sync" && isEnabled !== previous.settings.shareAnonymousUsage) {
        setUsageSharing(isEnabled);
      }
    }
    return fileStore.subscribe(handleFileChange);
  }, [fileStore]);
}

export interface AppDataProviderProps {
  /** Signs the user in and out; without it, accounts are unavailable and no login UI shows. */
  accountService?: AccountService;
  /** The account's copy of the log; with a signed-in account, the local file syncs with it. */
  remoteStore?: RemoteStore;
  children: ReactNode;
}

/**
 * Loads the save file, saves it on every change and shares it, its derived states, the account
 * and the actions. The file lives in a FileStore, so the sync engine can read and change it too.
 */
export function AppDataProvider({ accountService, remoteStore, children }: AppDataProviderProps) {
  // One store per provider, loaded when it mounts.
  const [fileStore] = useState(() => createFileStore(appStore));
  const file = useSyncExternalStore(fileStore.subscribe, fileStore.getFile);
  const todayDate = useTodayDate();
  const accountValue = useAccount(accountService);
  const { account } = accountValue;
  const syncValue = useSync({
    account,
    fileStore,
    remoteStore,
    syncMetaStore: getSyncMetaStore(),
  });
  const isSignedIn = account.status === "signedIn";
  useUsageSharingFromStorage(fileStore);
  useUsageSharingFromSync(fileStore);

  const states = useMemo(() => deriveAllStates(PROBLEM_IDS, file.entries), [file.entries]);

  const value = useMemo<AppDataValue>(
    () => ({
      ...accountValue,
      ...syncValue,
      problems: PROBLEMS,
      file,
      states,
      todayDate,
      addAttempt: (attempt) => fileStore.update((current) => reducers.addAttempt(current, attempt)),
      markMastered: (problemId) =>
        fileStore.update((current) => reducers.markMastered(current, problemId)),
      deleteEntry: (entryId) =>
        fileStore.update((current) => reducers.deleteEntry(current, entryId)),
      updateSettings: (partial) => {
        if (partial.shareAnonymousUsage !== undefined) {
          setUsageSharing(partial.shareAnonymousUsage);
        }
        fileStore.update((current) => reducers.updateSettings(current, partial));
      },
      startTimer: (problemId) =>
        fileStore.update((current) => reducers.startTimer(current, problemId)),
      restartTimer: (problemId) =>
        fileStore.update((current) => reducers.restartTimer(current, problemId)),
      clearTimer: () => fileStore.update(reducers.clearTimer),
      importText: (text) => {
        const current = fileStore.getFile();
        const result = importJson(text, current);
        if (!result.ok) {
          return result;
        }
        // The import takes the file's settings only into an empty log; then its choice is adopted.
        if (result.file.settings !== current.settings) {
          setUsageSharing(result.file.settings.shareAnonymousUsage);
        }
        fileStore.update(() => result.file);
        return result;
      },
      resetProgress: () =>
        fileStore.update(isSignedIn ? reducers.resetProgressEverywhere : reducers.resetProgress),
    }),
    [accountValue, syncValue, isSignedIn, fileStore, file, states, todayDate],
  );

  return <AppDataContext value={value}>{children}</AppDataContext>;
}

/** Returns the save file, derived states, today's date and the actions that change the file. */
export function useAppData(): AppDataValue {
  const value = useContext(AppDataContext);
  if (value === undefined) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return value;
}
