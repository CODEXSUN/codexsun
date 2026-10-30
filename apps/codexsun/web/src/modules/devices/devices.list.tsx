import {
  formatDateTime,
  WorkspaceStatusBadge,
  WorkspaceTablePanel,
  WorkspaceTableHeaderCell
} from "@codexsun/ui/workspace";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@codexsun/ui/components/table";
import type { CodexsunDevice } from "./devices.types";

export function CodexsunDevicesList({ records }: { records: CodexsunDevice[] }) {
  return (
    <WorkspaceTablePanel>
      <Table>
        <TableHeader>
          <TableRow>
            <WorkspaceTableHeaderCell>Device</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Portal</WorkspaceTableHeaderCell>
            <WorkspaceTableHeaderCell>Last contact</WorkspaceTableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.uuid}>
              <TableCell>{record.label}</TableCell>
              <TableCell>
                <WorkspaceStatusBadge tone="info" label={record.kind} />
              </TableCell>
              <TableCell>{formatDateTime(record.lastSeenAt)}</TableCell>
            </TableRow>
          ))}
          {!records.length && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No registered devices.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </WorkspaceTablePanel>
  );
}
