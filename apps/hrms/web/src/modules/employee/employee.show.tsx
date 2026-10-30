import { Button } from "@codexsun/ui/components/button";
import { WorkspaceDetailTable, WorkspaceShowCard } from "@codexsun/ui/workspace/show";
import { WorkspaceFormBanner, WorkspaceUpsertDialog } from "@codexsun/ui/workspace/upsert";
import { formatDate, formatDateTime } from "@codexsun/ui/workspace";
import { useEmployeeActivity } from "./employee.hooks";
import type { EmployeeGateway } from "./employee.services";
import type { EmployeeRecord } from "./employee.types";

export function EmployeeShow({
  employee,
  gateway,
  onClose,
  onEdit
}: {
  employee: EmployeeRecord | null;
  gateway: EmployeeGateway;
  onClose: () => void;
  onEdit: (employee: EmployeeRecord) => void;
}) {
  const history = useEmployeeActivity(gateway, employee?.id ?? null);
  return (
    <WorkspaceUpsertDialog
      open={Boolean(employee)}
      title={employee ? `${employee.employeeCode} · ${employee.name}` : "Employee"}
      className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
      onClose={onClose}
    >
      {employee && (
        <div className="space-y-4">
          {!employee.deletedAt && (
            <Button variant="outline" onClick={() => onEdit(employee)}>
              Edit employee
            </Button>
          )}
          <WorkspaceShowCard title="Employee details">
            <WorkspaceDetailTable
              rows={[
                ["Employee code", employee.employeeCode],
                ["Name", employee.name],
                ["Email", employee.email || "—"],
                ["Phone", employee.phone || "—"],
                ["Department", employee.department || "—"],
                ["Designation", employee.designation || "—"],
                ["Joining date", employee.joiningDate ? formatDate(employee.joiningDate) : "—"],
                [
                  "User account",
                  employee.userName ? `${employee.userName} (${employee.userEmail})` : "Not mapped"
                ],
                ["User ID", employee.userId ?? "—"],
                [
                  "Status",
                  employee.deletedAt
                    ? "Deleted"
                    : employee.status === "active"
                      ? "Active"
                      : "Inactive"
                ],
                ["Notes", employee.notes || "—"],
                ["Created", formatDateTime(employee.createdAt)],
                ["Updated", formatDateTime(employee.updatedAt)]
              ]}
            />
          </WorkspaceShowCard>
          <WorkspaceShowCard title="Activity">
            {history.isPending && <p className="p-4 text-sm">Loading activity…</p>}
            {history.isError && (
              <WorkspaceFormBanner title="Activity could not be loaded">
                {history.error.message}
              </WorkspaceFormBanner>
            )}
            {history.data?.map((item) => (
              <div key={item.id} className="border-b p-3 text-sm">
                <p>{item.summary}</p>
                <p className="text-muted-foreground">
                  {item.actorEmail} · {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))}
            {history.isSuccess && !history.data.length && (
              <p className="p-4 text-sm">No activity recorded.</p>
            )}
          </WorkspaceShowCard>
        </div>
      )}
    </WorkspaceUpsertDialog>
  );
}
