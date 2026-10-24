import { useEffect, useState } from "react";
import { useBridgeConnection } from "../database-connection/index.js";
import { transfers } from "./transfer-session.services.js";
import type { TransferSession } from "./transfer-session.types.js";
export type TableCatalogEntry = {
  table: string;
  sourceRows: number | null;
  targetRows: number | null;
  sourceAvailable: boolean;
  targetAvailable: boolean;
  issues: string[];
};
export type ImportGroupPort = {
  list: () => Promise<TransferSession[]>;
  catalog: (source: number, target: number) => Promise<TableCatalogEntry[]>;
  create: (source: number, target: number) => Promise<TransferSession>;
};
export function useImportGroup(
  port: ImportGroupPort,
  stage: number,
  id: string | undefined,
  onNavigate: (stage: number, id?: string) => void
) {
  const connection = useBridgeConnection();
  const [session, setSession] = useState<TransferSession | null>(null),
    [sessions, setSessions] = useState<TransferSession[]>([]),
    [tables, setTables] = useState<TableCatalogEntry[]>([]),
    [error, setError] = useState("");
  const [busy, setBusy] = useState(false),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    void (async () => {
      const saved = await port.list();
      const current = id ? await transfers.get(id) : null;
      if (current && !saved.some((item) => item.id === id))
        throw new Error("This saved import belongs to another table group. Open it from Report.");
      const pair = current ?? connection;
      const catalog = pair ? await port.catalog(pair.sourceId, pair.targetTenantId) : [];
      if (active) {
        setSession(current);
        setSessions(
          saved.filter(
            (item) =>
              !pair ||
              (item.sourceId === pair.sourceId && item.targetTenantId === pair.targetTenantId)
          )
        );
        setTables(catalog);
      }
    })()
      .catch((cause: Error) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [port, stage, id, connection, refresh]);
  const pair = session ?? connection;
  async function start(table?: string) {
    if (!pair) return;
    setBusy(true);
    setError("");
    try {
      let next = await port.create(pair.sourceId, pair.targetTenantId);
      if (
        table &&
        tables.some((item) => item.table === table && item.sourceAvailable && item.targetAvailable)
      ) {
        next = await transfers.tables(next.id, next.revision, table, table);
        onNavigate(3, next.id);
      } else onNavigate(2, next.id);
      setSession(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to prepare mapping.");
    } finally {
      setBusy(false);
    }
  }
  return {
    pair,
    session,
    sessions,
    tables,
    error,
    busy,
    start,
    refresh: () => setRefresh((value) => value + 1)
  };
}
