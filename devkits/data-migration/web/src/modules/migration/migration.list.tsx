import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { MigrationRun, SourceOption, TenantOption } from "./migration.services.js";

export function RunHistory({
  runs,
  sources,
  tenants
}: {
  runs: MigrationRun[];
  sources: SourceOption[];
  tenants: TenantOption[];
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">Recent runs</h2>
      <WorkspaceTable<MigrationRun>
        data={runs}
        emptyState="No migration runs yet."
        columns={[
          { accessorKey: "table", header: "TABLE" },
          {
            id: "route",
            header: "SOURCE → DESTINATION",
            cell: ({ row }) =>
              `${sources.find((item) => item.id === row.original.sourceId)?.label ?? `Source ${row.original.sourceId}`} → ${tenants.find((item) => item.id === row.original.targetTenantId)?.label ?? `Tenant ${row.original.targetTenantId}`}`
          },
          {
            id: "rows",
            header: "ROWS",
            cell: ({ row }) => `${row.original.copiedRows} / ${row.original.sourceRows}`
          },
          {
            id: "status",
            header: "STATUS",
            cell: ({ row }) => (
              <span title={row.original.error ?? undefined}>
                <WorkspaceStatusBadge
                  label={row.original.status}
                  tone={
                    row.original.status === "completed"
                      ? "success"
                      : row.original.status === "failed"
                        ? "danger"
                        : "warning"
                  }
                />
              </span>
            )
          },
          {
            id: "actor",
            header: "BY",
            cell: ({ row }) => row.original.actor
          },
          {
            id: "started",
            header: "STARTED",
            cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
          }
        ]}
      />
    </section>
  );
}
