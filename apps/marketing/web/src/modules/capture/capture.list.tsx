import type { LegacyColumnDef as ColumnDef } from "@tanstack/react-table/legacy";
import { WorkspaceTable } from "@codexsun/ui/workspace/table";
import { WorkspaceRowActions } from "@codexsun/ui/workspace/row-actions";
import { WorkspaceStatusBadge } from "@codexsun/ui/workspace/status";
import type { CaptureRecord } from "./capture.types";
export function CaptureList({records,loading,onView,onEdit,onToggle}:{records:CaptureRecord[];loading:boolean;onView:(record:CaptureRecord)=>void;onEdit:(record:CaptureRecord)=>void;onToggle:(record:CaptureRecord)=>void;}) {
 const columns:ColumnDef<CaptureRecord>[]=[{accessorKey:"name",header:"NAME"},{accessorKey:"updatedBy",header:"UPDATED BY"},{accessorKey:"status",header:"STATUS",cell:({row})=><WorkspaceStatusBadge label={row.original.status==="active"?"Active":"Inactive"} tone={row.original.status==="active"?"success":"neutral"}/>},
 {id:"actions",header:"ACTION",cell:({row})=><div onClick={event=>event.stopPropagation()}><WorkspaceRowActions title={row.original.name} onView={()=>onView(row.original)} onEdit={()=>onEdit(row.original)} isSuspended={row.original.status==="inactive"} onDelete={()=>onToggle(row.original)} onRestore={()=>onToggle(row.original)}/></div>}];
 return <WorkspaceTable columns={columns} data={records} isLoading={loading} onRowClick={onView} emptyState="No captures found."/>;
}
