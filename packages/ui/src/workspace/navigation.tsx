import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction
} from "react";
import { createPortal } from "react-dom";

type SearchPatch = Record<string, string | undefined>;
type WorkspaceNavigation = {
  headerTarget: HTMLElement | null;
  inlineForms: boolean;
  search: Record<string, unknown>;
  updateSearch: (patch: SearchPatch) => void;
};
const NavigationContext = createContext<WorkspaceNavigation | null>(null);

export function WorkspaceNavigationProvider({
  children,
  headerTarget,
  inlineForms = false,
  search,
  onSearchChange
}: {
  children: ReactNode;
  headerTarget: HTMLElement | null;
  inlineForms?: boolean;
  search: Record<string, unknown>;
  onSearchChange: (search: Record<string, unknown>) => void;
}) {
  const pending = useRef<SearchPatch | null>(null);
  const current = useRef({ search, onSearchChange });
  current.current = { search, onSearchChange };
  function updateSearch(patch: SearchPatch) {
    const scheduled = pending.current !== null;
    pending.current = { ...pending.current, ...patch };
    if (scheduled) return;
    queueMicrotask(() => {
      const next = { ...current.current.search, ...pending.current };
      pending.current = null;
      for (const key of Object.keys(next))
        if (next[key] === undefined || next[key] === "") delete next[key];
      current.current.onSearchChange(next);
    });
  }
  return (
    <NavigationContext.Provider value={{ headerTarget, inlineForms, search, updateSearch }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function WorkspaceHeaderActions({ children }: { children: ReactNode }) {
  const navigation = useContext(NavigationContext);
  return navigation?.headerTarget ? createPortal(children, navigation.headerTarget) : children;
}

export function useWorkspaceNavigation() {
  return useContext(NavigationContext);
}

export function useWorkspaceRecordSelection<T>(
  records: readonly T[],
  recordKey: (record: T) => string
): [T | null | undefined, (record: T | null | undefined) => void] {
  const navigation = useWorkspaceNavigation();
  const [local, setLocal] = useState<T | null | undefined>(undefined);
  const mode = navigation?.search.form;
  const key = String(navigation?.search.record ?? "");
  const selected = mode === "new" ? null : mode === "edit"
    ? records.find((record) => recordKey(record) === key)
    : undefined;
  return [navigation ? selected : local, (record) => {
    if (!navigation) setLocal(record);
    else navigation.updateSearch({
      form: record === undefined ? "" : record === null ? "new" : "edit",
      record: record ? recordKey(record) : ""
    });
  }];
}

type QueryValue<T> = T extends number ? number : string;
export function useWorkspaceQueryState<T extends Record<string, string | number | boolean>>(
  initial: T
): [T, Dispatch<SetStateAction<T>>] {
  const navigation = useWorkspaceNavigation();
  const [local, setLocal] = useState(initial);
  const value = Object.fromEntries(Object.entries(initial).map(([key, fallback]) => {
    const raw = navigation?.search[key];
    const parsed = raw === undefined ? fallback : typeof fallback === "boolean"
      ? String(raw) === "1" : typeof fallback === "number" ? Number(raw) : String(raw);
    return [key, typeof parsed === "number" && !Number.isFinite(parsed) ? fallback : parsed];
  })) as T;
  return [navigation ? value : local, (next) => {
    if (!navigation) { setLocal(next); return; }
    const resolved = typeof next === "function" ? next(value) : next;
    navigation.updateSearch(Object.fromEntries(Object.entries(resolved).map(([key, entry]) => [
      key, entry === initial[key] ? "" : typeof entry === "boolean" ? entry ? "1" : "0" : String(entry)
    ])));
  }];
}

export function useWorkspaceQueryValue<T extends string | number>(
  key: string,
  initial: T
): [QueryValue<T>, Dispatch<SetStateAction<QueryValue<T>>>] {
  const navigation = useWorkspaceNavigation();
  const [local, setLocal] = useState(initial as QueryValue<T>);
  const raw = navigation?.search[key];
  const parsed = typeof initial === "number" ? Number(raw ?? initial) : String(raw ?? initial);
  const value = (
    typeof parsed === "number" && (!Number.isSafeInteger(parsed) || parsed < 1) ? initial : parsed
  ) as QueryValue<T>;
  return [
    navigation ? value : local,
    (next) => {
      if (!navigation) {
        setLocal(next);
        return;
      }
      const resolved = typeof next === "function" ? next(value) : next;
      navigation.updateSearch({ [key]: resolved === initial ? "" : String(resolved) });
    }
  ];
}
