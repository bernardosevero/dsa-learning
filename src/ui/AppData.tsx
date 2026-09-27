import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { PROBLEMS } from "@/data/problems";
import { today } from "@/domain/dates";
import { deriveAllStates } from "@/domain/schedule";
import type { LocalDate, Problem, ProblemState, SaveFile, Settings } from "@/domain/types";
import { createLocalStore, importJson } from "@/storage/localStore";

import * as reducers from "./appDataReducers";
import type { NewAttempt } from "./appDataReducers";

export interface AppDataValue {
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
  clearTimer: () => void;
  importText: (text: string) => ReturnType<typeof importJson>;
  resetProgress: () => void;
}

const AppDataContext = createContext<AppDataValue | undefined>(undefined);

const store = createLocalStore();
const PROBLEM_IDS = PROBLEMS.map((problem) => problem.id);

export interface AppDataProviderProps {
  children: ReactNode;
}

/** Loads the save file, saves it on every change and shares it, its derived states and the actions. */
export function AppDataProvider({ children }: AppDataProviderProps) {
  const [file, setFile] = useState(() => store.load());
  const [todayDate, setTodayDate] = useState(() => today());

  useEffect(() => {
    store.save(file);
  }, [file]);

  // The app can stay open past midnight, so the day is re-read whenever the user comes back.
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

  const states = useMemo(() => deriveAllStates(PROBLEM_IDS, file.entries), [file.entries]);

  const value = useMemo<AppDataValue>(
    () => ({
      problems: PROBLEMS,
      file,
      states,
      todayDate,
      addAttempt: (attempt) => setFile((current) => reducers.addAttempt(current, attempt)),
      markMastered: (problemId) => setFile((current) => reducers.markMastered(current, problemId)),
      deleteEntry: (entryId) => setFile((current) => reducers.deleteEntry(current, entryId)),
      updateSettings: (partial) => setFile((current) => reducers.updateSettings(current, partial)),
      startTimer: (problemId) => setFile((current) => reducers.startTimer(current, problemId)),
      clearTimer: () => setFile(reducers.clearTimer),
      importText: (text) => {
        const result = importJson(text, file);
        if (result.ok) {
          setFile(result.file);
        }
        return result;
      },
      resetProgress: () => setFile(reducers.resetProgress),
    }),
    [file, states, todayDate],
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
