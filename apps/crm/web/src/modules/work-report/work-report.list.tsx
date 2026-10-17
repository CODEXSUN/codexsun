import { formatDateTime } from "@codexsun/ui/workspace/utils";
import type { WorkReport } from "./work-report.types";
export function WorkReportList({items}:{items:WorkReport[]}) {
 return <div className="divide-y">{items.length === 0 ? <p className="py-4 text-sm text-muted-foreground">No actions reported yet.</p> : items.map((row)=><article key={row.uuid} className="space-y-1 py-3 text-sm">
 <p className="font-medium capitalize">{row.action.replaceAll("-"," ")} <span className="font-normal text-muted-foreground">· {row.created_by} · {formatDateTime(row.created_at)}</span></p>
 <p className="whitespace-pre-wrap">{row.body}</p>
 {row.latitude !== null && row.longitude !== null ? <p><a className="underline" href={`https://www.google.com/maps?q=${row.latitude},${row.longitude}`} target="_blank" rel="noreferrer">{row.latitude}, {row.longitude}</a> · Accuracy: {row.accuracy_meters ?? "Unknown"} m · Captured: {row.captured_at ? formatDateTime(row.captured_at) : "—"}</p>:null}
 </article>)}</div>;
}
