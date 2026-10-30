import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CodexsunSyncEngine } from "./sync.engine";
import { CodexsunIndexedDbStorage } from "./sync.storage";
import { codexsunScopeKey } from "./sync.types";
import type {
  CodexsunCache,
  CodexsunDraft,
  CodexsunSyncGateway,
  CodexsunSyncScope
} from "./sync.types";

type SyncState = CodexsunCache & {
  key: string;
  pending: number;
  syncing: boolean;
  error: string | null;
};
const emptyState: SyncState = {
  key: "",
  records: [],
  syncedAt: null,
  pending: 0,
  syncing: false,
  error: null
};

export function useCodexsunSync({
  gateway,
  scope
}: {
  gateway: CodexsunSyncGateway;
  scope: CodexsunSyncScope | null;
}) {
  const scopeKey = scope ? codexsunScopeKey(scope) : "";
  const active = useRef({ key: scopeKey, gateway, generation: 0 });
  if (active.current.key !== scopeKey || active.current.gateway !== gateway) {
    active.current = { key: scopeKey, gateway, generation: active.current.generation + 1 };
  }
  const generation = active.current.generation;
  const [state, setState] = useState<SyncState>(emptyState);
  const session = useMemo(() => {
    if (!scope || typeof indexedDB === "undefined") return null;
    const storage = new CodexsunIndexedDbStorage(scope);
    const lifecycle = { active: true };
    const isCurrent = () => lifecycle.active && active.current.generation === generation;
    return {
      storage,
      lifecycle,
      isCurrent,
      engine: new CodexsunSyncEngine(scope, gateway, storage, isCurrent)
    };
  }, [scopeKey, gateway, generation]);

  const refreshLocal = useCallback(async () => {
    if (!session || !session.isCurrent()) return;
    const [entries, cache] = await Promise.all([
      session.storage.list(),
      session.storage.readCache()
    ]);
    if (session.isCurrent())
      setState((previous) => ({ ...previous, ...cache, key: scopeKey, pending: entries.length }));
  }, [session, scopeKey]);

  const retry = useCallback(async () => {
    if (!session || !session.isCurrent()) return;
    setState((previous) => ({ ...previous, key: scopeKey, syncing: true, error: null }));
    try {
      await session.engine.sync();
    } catch (error) {
      if (session.isCurrent())
        setState((previous) => ({
          ...previous,
          error:
            error instanceof Error ? error.message : "Sync failed. Drafts remain saved locally."
        }));
    } finally {
      try {
        await refreshLocal();
      } catch (error) {
        if (session.isCurrent())
          setState((previous) => ({
            ...previous,
            error: error instanceof Error ? error.message : "Local storage unavailable"
          }));
      }
      if (session.isCurrent()) setState((previous) => ({ ...previous, syncing: false }));
    }
  }, [session, scopeKey, refreshLocal]);

  const saveDraft = useCallback(
    async (input: CodexsunDraft) => {
      if (!session || !session.isCurrent())
        throw new Error("Sign in to this workspace before saving a local draft.");
      await session.engine.saveDraft(input);
      await refreshLocal();
      void retry();
      return { message: "Draft saved on this device. Sync will confirm cloud submission." };
    },
    [session, refreshLocal, retry]
  );

  useEffect(() => {
    setState({ ...emptyState, key: scopeKey });
    if (!session) return;
    session.lifecycle.active = true;
    let disposed = false;
    const synchronize = () => {
      if (!disposed) void retry();
    };
    synchronize();
    window.addEventListener("online", synchronize);
    const timer = window.setInterval(synchronize, 30_000);
    return () => {
      disposed = true;
      session.lifecycle.active = false;
      session.storage.close();
      window.removeEventListener("online", synchronize);
      window.clearInterval(timer);
    };
  }, [session, scopeKey, retry]);

  const visible = state.key === scopeKey && scopeKey ? state : emptyState;
  return {
    pending: visible.pending,
    cachedRequirements: visible.records,
    syncing: visible.syncing,
    error: visible.error,
    lastSyncedAt: visible.syncedAt,
    saveDraft,
    retry,
    available: Boolean(session)
  };
}
