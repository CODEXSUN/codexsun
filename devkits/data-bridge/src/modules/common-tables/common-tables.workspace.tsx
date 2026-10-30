import { useState } from "react";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { Button } from "@codexsun/ui/components/button";
import {
  ImportStageTabs,
  TransferWorkspace,
  useImportGroup,
  SavedGroupImports
} from "../transfer-session/index.js";
import { GroupImportResults } from "../report/index.js";
import { commonTables } from "./common-tables.services.js";
export function CommonTablesWorkspace({
  stage,
  id,
  onNavigate,
  onConfigure,
  onReport
}: {
  stage: number;
  id?: string;
  onNavigate: (stage: number, id?: string) => void;
  onConfigure: () => void;
  onReport: (id: string) => void;
}) {
  const flow = useImportGroup(commonTables, stage, id, onNavigate);
  const [search, setSearch] = useState("");
  return (
    <WorkspacePage
      title="Common Tables"
      actions={
        <Button disabled={!flow.pair || flow.busy} onClick={() => void flow.start()}>
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
              <h2 className="font-semibold">Common table catalog · {flow.tables.length}</h2>
              <input
                className="h-9 rounded border bg-background px-3 text-sm"
                aria-label="Find common table"
                placeholder="Find common table"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    {["Common table", "Source rows", "Target rows", "Mapping", "Action"].map(
                      (label) => (
                        <th className="p-3" key={label}>
                          {label}
                        </th>
                      )
                    )}
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
                        <td className="p-3">
                          {table.issues.length
                            ? table.issues.join(", ")
                            : table.sourceAvailable
                              ? "Shared fields ready"
                              : "Choose a source table"}
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={flow.busy || !table.targetAvailable}
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
            <SavedGroupImports sessions={flow.sessions} onResume={onNavigate} />
          </section>
        ) : null}
        {stage === 6 && !id && flow.pair ? (
          <GroupImportResults
            sourceId={flow.pair.sourceId}
            targetTenantId={flow.pair.targetTenantId}
            scope="common"
            onReport={onReport}
          />
        ) : null}
        {!id && stage !== 2 && stage !== 6 ? (
          <p>Select a saved mapping or create a new mapping.</p>
        ) : null}
      </ImportStageTabs>
    </WorkspacePage>
  );
}
