import { formatDateTime } from "@codexsun/ui/workspace/utils";
import { WorkspaceTableEmptyState } from "@codexsun/ui/workspace/table";
import type { WhatsAppMessage } from "./enquiry-whatsapp.types";
export function EnquiryWhatsAppList({ items }: { items: WhatsAppMessage[] }) {
  return (
    <div className="workspace-scroll overflow-x-auto rounded-md border border-border/70">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            {["#", "Message", "To", "By", "Time", "Status"].map((label) => (
              <th key={label} className="px-3 py-2">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, index) => (
            <tr key={row.id} className="border-t border-border/70 align-top">
              <td className="px-3 py-2">{index + 1}</td>
              <td className="max-w-xl whitespace-pre-wrap break-words px-3 py-2">{row.message}</td>
              <td className="px-3 py-2">{row.recipient}</td>
              <td className="px-3 py-2">{row.userName || row.createdBy}</td>
              <td className="whitespace-nowrap px-3 py-2">{formatDateTime(row.createdAt)}</td>
              <td className="px-3 py-2">WhatsApp handoff</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!items.length ? (
        <WorkspaceTableEmptyState>No WhatsApp messages recorded.</WorkspaceTableEmptyState>
      ) : null}
    </div>
  );
}
