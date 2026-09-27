import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { PROBLEMS } from "@/data/problems";
import { today } from "@/domain/dates";
import { deriveAllStates } from "@/domain/schedule";
import type { LocalDate, Problem, ProblemState, SaveFile, Settings } from "@/domain/types";
import { createLocalStore, importJson, type Store } from "@/storage/localStore";

import * as reducers from "./appDataReducers";
import type { NewAttempt } from "./appDataReducers";

type ImportResult = ReturnType<typeof importJson>;

interface AppDataActions {
  addAttempt: (attempt: NewAttempt) => void;
  markMastered: (problemId: string) => void;
  deleteEntry: (entryId: string) => void;
  updateSettings: (partial: Partial<Settings>) => void;
  startTimer: (problemId: string) => void;
  clearTimer: () => void;
  importText: (text: string) => ImportResult;
  resetProgress: () => void;
}

export interface AppDataValue extends AppDataActions {
  problems: readonly Problem[];
  file: SaveFile;
  /** Derived from the log on every change; never stored. */
  states: Readonly<Record<string, ProblemState>>;
  todayDate: LocalDate;
}

const AppDataContext = createContext<AppDataValue | undefined>(undefined);

const PROBLEM_IDS = PROBLEMS.map((problem) => problem.id);

function useSavedFile(store: Store): [SaveFile, Dispatch<SetStateAction<SaveFile>>] {
  const [file, setFile] = useState(() => store.load());
  useEffect(() => {
    store.save(file);
  }, [store, file]);
  return [file, setFile];
}

// The app can stay open past midnight, so the day is re-read whenever the user comes back to it.
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

// Ids and times are made here, outside the state updaters, so the reducers stay pure.
function buildActions(file: SaveFile, setFile: Dispatch<SetStateAction<SaveFile>>): AppDataActions {
  return {
    addAttempt: (attempt) => {
      const id = crypto.randomUUID();
      setFile((current) => reducers.addAttempt(current, attempt, id));
    },
    markMastered: (problemId) => {
      const now = new Date();
      const mark = { id: crypto.randomUUID(), problemId, at: now.toISOString(), date: today(now) };
      setFile((current) => reducers.markMastered(current, mark));
    },
    deleteEntry: (entryId) => {
      const deletedAt = new Date().toISOString();
      setFile((current) => reducers.deleteEntry(current, entryId, deletedAt));
    },
    updateSettings: (partial) => {
      setFile((current) => reducers.updateSettings(current, partial));
    },
    startTimer: (problemId) => {
      const startedAt = new Date().toISOString();
      setFile((current) => reducers.startTimer(current, problemId, startedAt));
    },
    clearTimer: () => {
      setFile(reducers.clearTimer);
    },
    importText: (text) => {
      const result = importJson(text, file);
      if (result.ok) {
        setFile(result.file);
      }
      return result;
    },
    resetProgress: () => {
      const deletedAt = new Date().toISOString();
      setFile((current) => reducers.resetProgress(current, deletedAt));
    },
  };
}

export interface AppDataProviderProps {
  children: ReactNode;
  /** Where the save file lives; localStorage unless a test passes another. */
  store?: Store;
}

/** Loads the save file, saves it on every change and shares it, its derived states and the actions. */
export function AppDataProvider({ children, store }: AppDataProviderProps) {
  const [activeStore] = useState(() => store ?? createLocalStore());
  const [file, setFile] = useSavedFile(activeStore);
  const todayDate = useTodayDate();
  const states = useMemo(() => deriveAllStates(PROBLEM_IDS, file.entries), [file.entries]);

  const value = useMemo<AppDataValue>(
    () => ({ problems: PROBLEMS, file, states, todayDate, ...buildActions(file, setFile) }),
    [file, setFile, states, todayDate],
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
