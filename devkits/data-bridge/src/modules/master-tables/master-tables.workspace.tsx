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
import { masterTables } from "./master-tables.services.js";
export function MasterTablesWorkspace({
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
  const flow = useImportGroup(masterTables, stage, id, onNavigate);
  const [family, setFamily] = useState("all");
  const shown = flow.tables.filter(
    (table) => family === "all" || table.table.startsWith(`core_${family}`)
  );
  return (
    <WorkspacePage
      title="Master Tables"
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Master and child tables · {shown.length}</h2>
              <select
                className="h-9 rounded border bg-background px-3 text-sm"
                aria-label="Master family"
                value={family}
                onChange={(event) => setFamily(event.target.value)}
              >
                <option value="all">All masters</option>
                <option value="contacts">Contacts</option>
                <option value="companies">Companies</option>
                <option value="products">Products</option>
                <option value="work_orders">Work Orders</option>
              </select>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    {[
                      "Master / child table",
                      "Source rows",
                      "Target rows",
                      "Required mapping",
                      "Action"
                    ].map((label) => (
                      <th className="p-3" key={label}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((table) => (
                    <tr className="border-b" key={table.table}>
                      <td className="p-3">{table.table}</td>
                      <td className="p-3">{table.sourceRows ?? "—"}</td>
                      <td className="p-3">{table.targetRows ?? "—"}</td>
                      <td className="p-3">{table.issues.join(", ") || "None"}</td>
                      <td className="p-3">
                        <Button
                          variant="outline"
                          size="sm"
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
            scope="masters"
            onReport={onReport}
          />
        ) : null}
      </ImportStageTabs>
    </WorkspacePage>
  );
}
