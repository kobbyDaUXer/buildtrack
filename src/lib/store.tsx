"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AppState } from "./types";
import { seed, blank } from "./seed";

const KEY = "buildtrack.v1";

type Updater = (s: AppState) => AppState;

interface Store {
  state: AppState;
  hydrated: boolean;
  update: (fn: Updater) => void;
  reset: (kind: "sample" | "empty") => void;
  importJSON: (raw: string) => string | null;
}

const StoreContext = createContext<Store | null>(null);

function merge(loaded: Partial<AppState>): AppState {
  return {
    project: { ...seed.project, ...(loaded.project ?? {}) },
    phases: loaded.phases ?? [],
    budget: loaded.budget ?? [],
    tasks: loaded.tasks ?? [],
    contractors: loaded.contractors ?? [],
    log: (loaded.log ?? []).map((e) => ({ ...e, photos: e.photos ?? [] })),
  };
}

function readStored(): AppState {
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? merge(JSON.parse(raw)) : seed;
  } catch {
    /* corrupt or unavailable storage — fall back to the sample project */
    return seed;
  }
}

const noSubscribe = () => () => {};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [stored, setState] = useState<AppState>(readStored);

  /**
   * False on the server and on the hydration render, true from the first
   * client render onward. Every consumer therefore sees `seed` while the
   * markup is being matched up, and the browser's own data only after —
   * which is what keeps stored data from tripping a hydration mismatch.
   */
  const hydrated = useSyncExternalStore(
    noSubscribe,
    () => true,
    () => false,
  );

  const state = hydrated ? stored : seed;

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(stored));
    } catch {
      /* quota or private mode — the session still works, it just will not persist */
    }
  }, [stored, hydrated]);

  const update = useCallback((fn: Updater) => setState((s) => fn(s)), []);

  const reset = useCallback((kind: "sample" | "empty") => {
    setState(kind === "sample" ? structuredClone(seed) : structuredClone(blank));
  }, []);

  const importJSON = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return "That file is not a BuildTrack export.";
      setState(merge(parsed as Partial<AppState>));
      return null;
    } catch {
      return "Could not read that file — it is not valid JSON.";
    }
  }, []);

  const value = useMemo(
    () => ({ state, hydrated, update, reset, importJSON }),
    [state, hydrated, update, reset, importJSON],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}

/* ---- derived numbers, shared by the dashboard and the budget page ---- */

export function totals(state: AppState) {
  const budgeted = state.budget.reduce((n, i) => n + (i.budgeted || 0), 0);
  const spent = state.budget.reduce((n, i) => n + (i.actual || 0), 0);
  const unpaid = state.budget
    .filter((i) => !i.paid && i.actual > 0)
    .reduce((n, i) => n + i.actual, 0);
  const ceiling = state.project.budgetTotal || budgeted;
  const openTasks = state.tasks.filter((t) => !t.done).length;
  const progress = state.phases.length
    ? state.phases.reduce((n, p) => n + (p.progress || 0), 0) / state.phases.length
    : 0;
  return {
    budgeted,
    spent,
    unpaid,
    ceiling,
    remaining: ceiling - spent,
    usedPct: ceiling > 0 ? (spent / ceiling) * 100 : 0,
    openTasks,
    progress,
  };
}
