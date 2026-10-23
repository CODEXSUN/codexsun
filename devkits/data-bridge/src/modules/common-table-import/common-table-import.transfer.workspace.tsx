import { useEffect, useState } from "react";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { Button } from "@codexsun/ui/components/button";
import { Checkbox } from "@codexsun/ui/components/checkbox";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTableHeaderCell } from "@codexsun/ui/workspace/table";
import { TransferChoice, TransferFields } from "./common-table-import.transfer.fields.js";
import { TransferPrepare, TransferResults } from "./common-table-import.transfer.data.js";
import { transfers } from "./common-table-import.transfer.services.js";
import { listDataBridgeSources, listDataBridgeTenants } from "./common-table-import.services.js";
import type { DataBridgeSource, DataBridgeTenant } from "./common-table-import.types.js";
import type { TransferSession } from "./common-table-import.transfer.types.js";
export const transferStages = [
  "Database Connections",
  "Table Mapping",
  "Field Mapping",
  "Import Preparation",
  "Confirm Import",
  "Import Results"
];
export function TransferWorkspace({
  stage,
  id,
  onNavigate
}: {
  stage: number;
  id?: string;
  onNavigate: (stage: number, id?: string) => void;
}) {
  const [session, setSession] = useState<TransferSession | null>(null);
  const [sessions, setSessions] = useState<TransferSession[]>([]);
  const [sources, setSources] = useState<DataBridgeSource[]>([]);
  const [tenants, setTenants] = useState<DataBridgeTenant[]>([]);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [sourceTable, setSourceTable] = useState("");
  const [targetTable, setTargetTable] = useState("");
  const [tables, setTables] = useState<{ source: string[]; target: string[] }>({
    source: [],
    target: []
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setConfirmed(false);
    setError("");
    setSession(null);
    void (async () => {
      try {
        if (stage === 1) {
          const [s, t, list] = await Promise.all([
            listDataBridgeSources(),
            listDataBridgeTenants(),
            transfers.list()
          ]);
          if (active) {
            setSources(s);
            setTenants(t);
            setSessions(list);
          }
        }
        if (id) {
          const saved = await transfers.get(id);
          if (active) {
            setSession(saved);
            setSourceTable(saved.sourceTable);
            setTargetTable(saved.targetTable);
          }
          if (stage === 2) {
            const data = await transfers.inspect(id);
            if (active) setTables(data.tables);
          }
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load import.");
      }
    })();
    return () => {
      active = false;
    };
  }, [stage, id, reload]);
  useEffect(() => {
    if (!id || session?.status !== "queued") return;
    const timer = setInterval(() => {
      void transfers
        .get(id)
        .then(setSession)
        .catch((e: Error) => setError(e.message));
    }, 1500);
    return () => clearInterval(timer);
  }, [id, session?.status]);
  async function act(operation: () => Promise<TransferSession>, next: number) {
    setBusy(true);
    setError("");
    try {
      const saved = await operation();
      setSession(saved);
      onNavigate(next, saved.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Operation failed.");
    } finally {
      setBusy(false);
    }
  }
  const locked = !!session && ["queued", "completed"].includes(session.status);
  return (
    <WorkspacePage
      title={transferStages[stage - 1] ?? "Data Bridge"}
      description={`Data Bridge / Step ${stage} of 6`}
    >
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button variant="outline" disabled={busy} onClick={() => setReload((value) => value + 1)}>
            Reload stage
          </Button>
        </div>
        <nav aria-label="Import stages" className="flex flex-wrap gap-2">
          {transferStages.map((name, index) => (
            <Button
              key={name}
              variant={index + 1 === stage ? "default" : "outline"}
              disabled={busy || (index > 0 && (!session || session.stage < index + 1))}
              onClick={() => onNavigate(index + 1, id)}
            >
              {index + 1}. {name}
            </Button>
          ))}
        </nav>
        {error && (
          <p role="alert" className="rounded border border-destructive p-3 text-destructive">
            {error}
          </p>
        )}
        {session && (
          <div className="flex flex-wrap justify-between gap-2 rounded border p-3">
            <div>
              <p className="font-semibold">
                {session.sourceDatabase} / {session.sourceTable || "Source table"} to{" "}
                {session.targetDatabase} / {session.targetTable || "Target table"}
              </p>
              <p className="text-sm text-muted-foreground">{session.message}</p>
            </div>
            <WorkspaceStatusBadge
              label={
                session.status === "completed" &&
                session.rows.some((row) => row.status === "warning")
                  ? "Completed with warnings"
                  : session.status
              }
              tone={
                session.status === "failed"
                  ? "danger"
                  : session.status === "completed"
                    ? session.rows.some((row) => row.status === "warning")
                      ? "warning"
                      : "success"
                    : "info"
              }
            />
          </div>
        )}
        {stage === 1 ? (
          <>
            <section className="grid gap-4 rounded border p-4 md:grid-cols-2">
              <label className="space-y-2">
                Source connection
                <TransferChoice
                  value={sourceId}
                  onChange={setSourceId}
                  options={sources.map((s) => ({
                    value: String(s.id),
                    label: `${s.label} / ${s.database}`
                  }))}
                />
              </label>
              <label className="space-y-2">
                Destination tenant
                <TransferChoice
                  value={targetId}
                  onChange={setTargetId}
                  options={tenants.map((t) => ({
                    value: String(t.id),
                    label: `${t.label} / ${t.database ?? ""}`
                  }))}
                />
              </label>
              <Button
                disabled={busy || !sourceId || !targetId}
                onClick={() =>
                  void act(() => transfers.create(Number(sourceId), Number(targetId)), 2)
                }
              >
                Verify connections and continue
              </Button>
            </section>
            <h2 className="font-semibold">Saved imports</h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {["Source", "Destination", "Table pair", "Status", "Action"].map((label) => (
                    <WorkspaceTableHeaderCell key={label}>{label}</WorkspaceTableHeaderCell>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="p-3">{s.sourceDatabase}</td>
                    <td className="p-3">{s.targetDatabase}</td>
                    <td className="p-3">
                      {s.sourceTable || "-"} to {s.targetTable || "-"}
                    </td>
                    <td className="p-3">{s.status}</td>
                    <td className="p-3">
                      <Button variant="outline" onClick={() => onNavigate(s.stage, s.id)}>
                        Resume
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : !session ? (
          <p>
            {id && !error
              ? "Loading verified import..."
              : "Select a saved import from Database Connections."}
          </p>
        ) : session.stage < stage ? (
          <p>Complete and verify the previous stage first.</p>
        ) : (
          <>
            {stage === 2 ? (
              <section className="space-y-4 rounded border p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    Source table
                    <TransferChoice
                      disabled={locked || busy}
                      value={sourceTable}
                      onChange={setSourceTable}
                      options={tables.source.map((value) => ({ value, label: value }))}
                    />
                  </label>
                  <label>
                    Destination table
                    <TransferChoice
                      disabled={locked || busy}
                      value={targetTable}
                      onChange={setTargetTable}
                      options={tables.target.map((value) => ({ value, label: value }))}
                    />
                  </label>
                </div>
                <Button
                  disabled={locked || busy || !sourceTable || !targetTable}
                  onClick={() =>
                    void act(
                      () =>
                        transfers.tables(session.id, session.revision, sourceTable, targetTable),
                      3
                    )
                  }
                >
                  Verify table pair and continue
                </Button>
              </section>
            ) : null}
            {stage === 3 ? (
              <TransferFields
                session={session}
                busy={busy || locked}
                onSave={(fields) =>
                  void act(() => transfers.fields(session.id, session.revision, fields), 4)
                }
              />
            ) : null}
            {stage === 4 ? (
              <TransferPrepare
                key={session.id}
                session={session}
                busy={busy || locked}
                onSave={(ids) =>
                  void act(() => transfers.prepare(session.id, session.revision, ids), 5)
                }
              />
            ) : null}
            {stage === 5 ? (
              <section className="space-y-4">
                <h2 className="font-semibold">Verify exact destination data before import</h2>
                <TransferResults session={session} />
                <label className="flex items-center gap-2">
                  <Checkbox
                    checked={confirmed}
                    onCheckedChange={(value) => setConfirmed(value === true)}
                    disabled={locked || busy}
                  />
                  I verified the destination and prepared records. Import missing rows and preserve
                  existing records.
                </label>
                <Button
                  disabled={
                    locked ||
                    busy ||
                    !confirmed ||
                    session.status !== "prepared" ||
                    !session.rows.length
                  }
                  onClick={() => void act(() => transfers.commit(session.id, session.revision), 6)}
                >
                  {session.rows.some((row) => row.status === "ready")
                    ? "Confirm and queue import"
                    : "Complete review (no new rows)"}
                </Button>
              </section>
            ) : null}
            {stage === 6 ? (
              <section className="space-y-4">
                <div className="flex justify-between gap-3">
                  <h2 className="font-semibold">Saved import audit</h2>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void act(() => transfers.get(session.id), 6)}
                  >
                    Refresh results
                  </Button>
                </div>
                <TransferResults session={session} />
              </section>
            ) : null}
          </>
        )}
      </div>
    </WorkspacePage>
  );
}
