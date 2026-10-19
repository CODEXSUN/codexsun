import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { SourceForm } from "./migration.form.js";
import {
  listSources,
  getCurrentConnection,
  saveCurrentConnection,
  removeSource,
  verifySource,
  type SourceOption
} from "./migration.services.js";

export function DataMigrationSettings({ onOpenMigration }: { onOpenMigration: () => void }) {
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [editing, setEditing] = useState<SourceOption | null>(null);
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [currentConnection, setCurrentConnection] = useState<{
    host: string;
    port: number;
    user: string;
  } | null>(null);
  const [usingCurrent, setUsingCurrent] = useState(false);

  useEffect(() => {
    void getCurrentConnection()
      .then(setCurrentConnection)
      .catch((reason: unknown) => setError(message(reason)));
    void listSources()
      .then((items) => {
        setSources(items);
        if (items.length === 0) setAdding(true);
      })
      .catch((reason: unknown) => setError(message(reason)));
  }, []);

  async function useCurrentConnection() {
    setUsingCurrent(true);
    setError("");
    try {
      const { id } = await saveCurrentConnection();
      const items = await refresh();
      setAdding(false);
      setEditing(items.find((item) => item.id === id) ?? null);
      toast.success("Platform MariaDB connection saved. Choose a source database when ready.");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setUsingCurrent(false);
    }
  }

  async function refresh() {
    const items = await listSources();
    setSources(items);
    return items;
  }

  async function recheck(id: number) {
    setBusyId(id);
    setError("");
    try {
      await verifySource(id);
      await refresh();
      toast.success("External source connection verified.");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    if (
      !window.confirm(
        "Remove this saved source? Its password will be erased, and its migration history will remain."
      )
    )
      return;
    setBusyId(id);
    setError("");
    try {
      await removeSource(id);
      await refresh();
      toast.success("Saved source removed.");
    } catch (reason) {
      setError(message(reason));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <WorkspacePage
      title="Migration Settings"
      description="Set external MariaDB connection details and secrets for migration runs."
    >
      <div className="flex flex-wrap items-center gap-2">
        {!adding && !editing ? (
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setAdding(true);
            }}
          >
            Add source
          </Button>
        ) : null}
        <Button type="button" variant="outline" onClick={onOpenMigration}>
          Open Migration
        </Button>
      </div>
      {currentConnection ? (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-md border p-4">
          <div>
            <h2 className="font-semibold">Current CODEXSUN MariaDB</h2>
            <p className="text-sm text-muted-foreground">
              {currentConnection.host}:{currentConnection.port} · {currentConnection.user}
            </p>
            <p className="text-sm text-muted-foreground">
              Uses the server connection securely. The Platform master database is excluded.
            </p>
          </div>
          <Button type="button" variant="outline" disabled={usingCurrent} onClick={() => void useCurrentConnection()}>
            {usingCurrent ? "Saving…" : "Use current connection"}
          </Button>
        </section>
      ) : null}
      {adding || editing ? (
        <SourceForm
          key={editing?.id ?? "new"}
          source={editing ?? undefined}
          sources={sources}
          onCancel={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={(id) => {
            void refresh()
              .then((items) => {
                setAdding(false);
                setEditing(items.find((item) => item.id === id) ?? null);
                toast.success("Connection saved. Choose a database when ready.");
              })
              .catch((reason: unknown) => setError(message(reason)));
          }}
        />
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Saved sources</h2>
        <WorkspaceTable<SourceOption>
          data={sources}
          emptyState="No external MariaDB source saved yet."
          columns={[
            { accessorKey: "label", header: "SOURCE" },
            {
              id: "host",
              header: "HOST / PORT",
              cell: ({ row }) => `${row.original.host}:${row.original.port}`
            },
            {
              id: "database",
              header: "DATABASE",
              cell: ({ row }) => row.original.database || "Not selected"
            },
            { accessorKey: "user", header: "USER" },
            {
              id: "tls",
              header: "TLS",
              cell: ({ row }) => (row.original.tlsMode === "required" ? "Required" : "Disabled")
            },
            {
              id: "verified",
              header: "VERIFIED",
              cell: ({ row }) => (
                <WorkspaceStatusBadge
                  label={row.original.verifiedAt ? "Verified" : "Not verified"}
                  tone={row.original.verifiedAt ? "success" : "warning"}
                />
              )
            },
            {
              id: "actions",
              header: "ACTIONS",
              cell: ({ row }) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setAdding(false);
                      setEditing(row.original);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyId !== null}
                    onClick={() => void recheck(row.original.id)}
                  >
                    Test
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    title="Remove saved source"
                    aria-label={`Remove ${row.original.label}`}
                    disabled={busyId !== null}
                    onClick={() => void remove(row.original.id)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </div>
              )
            }
          ]}
        />
      </section>
      <p className="text-sm text-muted-foreground">
        Saved passwords are encrypted and never shown here. Destination database credentials come
        from the registered CODEXSUN tenant.
      </p>
    </WorkspacePage>
  );
}

function message(reason: unknown) {
  return reason instanceof Error ? reason.message : "Migration settings could not be loaded.";
}
