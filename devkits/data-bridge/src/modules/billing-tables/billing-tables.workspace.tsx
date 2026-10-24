import { useState } from "react";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { Button } from "@codexsun/ui/components/button";
import {
  ImportStageTabs,
  TransferWorkspace,
  useImportGroup,
  SavedGroupImports
} from "../transfer-session/index.js";
import { billingTables } from "./billing-tables.services.js";
export function BillingTablesWorkspace({
  stage,
  id,
  onNavigate,
  onConfigure
}: {
  stage: number;
  id?: string;
  onNavigate: (stage: number, id?: string) => void;
  onConfigure: () => void;
}) {
  const flow = useImportGroup(billingTables, stage, id, onNavigate);
  const [search, setSearch] = useState("");
  return (
    <WorkspacePage
      title="Billing Tables"
      actions={
        <Button
          disabled={!flow.pair || flow.busy || !flow.tables.length}
          onClick={() => void flow.start()}
        >
          New mapping
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          {flow.pair
            ? `${flow.pair.sourceDatabase} → ${flow.pair.targetDatabase}`
            : "Verify a source and target in Database Connection."}
        </p>
        <Button size="sm" variant="outline" onClick={onConfigure}>
          Change connection
        </Button>
      </div>
      {flow.error ? (
        <p role="alert" className="mb-3 text-sm text-destructive">
          {flow.error}
        </p>
      ) : null}
      <ImportStageTabs
        stage={stage}
        session={flow.session}
        onNavigate={(next) => onNavigate(next, id)}
      >
        {id ? (
          <TransferWorkspace
            stage={stage}
            id={id}
            onNavigate={onNavigate}
            embedded
            allowedTargets={flow.tables.map((table) => table.table)}
          />
        ) : null}
        {stage === 2 ? (
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Destination Billing tables · {flow.tables.length}</h2>
              <input
                aria-label="Find Billing table"
                placeholder="Find Billing table"
                className="h-9 rounded border bg-background px-3 text-sm"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            {flow.pair && !flow.busy && !flow.tables.length ? (
              <p className="py-5 text-sm text-muted-foreground">
                No Billing tables are installed in this target database.
              </p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {[
                        "Billing table",
                        "Source rows",
                        "Target rows",
                        "Fields to verify",
                        "Action"
                      ].map((label) => (
                        <th className="p-3" key={label}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {flow.tables
                      .filter((table) => table.table.includes(search))
                      .map((table) => (
                        <tr key={table.table} className="border-b">
                          <td className="p-3">{table.table}</td>
                          <td className="p-3">{table.sourceRows ?? "—"}</td>
                          <td className="p-3">{table.targetRows ?? "—"}</td>
                          <td className="p-3">{table.issues.join(", ") || "Shared fields"}</td>
                          <td className="p-3">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={flow.busy}
                              onClick={() => void flow.start(table.table)}
                            >
                              Map table
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
            <SavedGroupImports sessions={flow.sessions} onResume={onNavigate} />
          </section>
        ) : null}
        {stage === 6 && !id ? (
          <SavedGroupImports sessions={flow.sessions} onResume={onNavigate} />
        ) : null}
      </ImportStageTabs>
    </WorkspacePage>
  );
}
