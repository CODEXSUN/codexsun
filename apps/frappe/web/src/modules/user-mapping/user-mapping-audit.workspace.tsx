import { RefreshCw } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { WorkspacePage } from "@codexsun/ui/workspace/page";
import { useUserMappingAudit } from "./user-mapping.hooks";

export function FrappeIdentityAuditWorkspace() {
  const audit = useUserMappingAudit();
  return (
    <WorkspacePage
      title="Frappe identity audit"
      description="Compare local user mappings with Frappe User and Employee records. This audit is read-only and uses fixed field checks."
      technicalName="page.frappe.identity-audit"
      actions={
        <Button
          variant="outline"
          disabled={audit.isFetching}
          onClick={() => {
            void audit.refetch();
          }}
        >
          <RefreshCw className="size-4" /> Refresh audit
        </Button>
      }
    >
      {audit.isFetching ? (
        <p role="status" className="text-sm text-muted-foreground">
          Checking Frappe users and employees…
        </p>
      ) : null}
      {audit.error ? (
        <p role="alert" className="text-sm text-destructive">
          {audit.error.message}
        </p>
      ) : null}
      {audit.data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-5">
            {Object.entries(audit.data.totals).map(([label, value]) => (
              <Card key={label} className="p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {label.replace(/[A-Z]/gu, (letter) => ` ${letter}`)}
                </p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
              </Card>
            ))}
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3">Result</th>
                  <th className="p-3">Local user</th>
                  <th className="p-3">Frappe user</th>
                  <th className="p-3">Employee mapping</th>
                  <th className="p-3">Findings</th>
                </tr>
              </thead>
              <tbody>
                {audit.data.mappings.map((row) => (
                  <tr key={row.localUserId} className="border-t align-top">
                    <td className="p-3 font-medium">
                      {row.status === "matched" ? "Matched" : "Mismatch"}
                    </td>
                    <td className="p-3">
                      {row.localName}
                      <br />
                      <span className="text-muted-foreground">
                        {row.localEmail ?? "—"} · {row.localStatus ?? "missing"}
                      </span>
                    </td>
                    <td className="p-3">
                      {row.frappeName ?? row.frappeUserId}
                      <br />
                      <span className="text-muted-foreground">{row.frappeEmail}</span>
                    </td>
                    <td className="p-3">
                      {row.employeeCode ?? "No employee code"}
                      <br />
                      <span className="text-muted-foreground">
                        {row.employeeUserId ?? "—"} · {row.employeeStatus ?? "—"}
                      </span>
                    </td>
                    <td className="p-3">
                      {row.issues.length ? row.issues.join(" ") : "All mapped fields match."}
                    </td>
                  </tr>
                ))}
                {audit.data.unmapped.map((row) => (
                  <tr key={`unmapped-${row.localUserId}`} className="border-t align-top">
                    <td className="p-3 font-medium">Unmapped</td>
                    <td className="p-3">
                      {row.localName}
                      <br />
                      <span className="text-muted-foreground">
                        {row.localEmail} · {row.localStatus}
                      </span>
                    </td>
                    <td className="p-3">—</td>
                    <td className="p-3">—</td>
                    <td className="p-3">No Frappe identity mapping is configured.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="text-xs text-muted-foreground">
            Read-only audit completed {new Date(audit.data.checkedAt).toLocaleString()}.
          </p>
        </>
      ) : null}
    </WorkspacePage>
  );
}
