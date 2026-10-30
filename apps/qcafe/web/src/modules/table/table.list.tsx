import { Armchair, Pencil } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import type { CafeTable } from "./table.types";
export function TableList({
  items,
  onEdit,
  canManage,
  compact = false,
  onSelect
}: {
  items: CafeTable[];
  compact?: boolean;
  onSelect?: (item: CafeTable) => void;
  onEdit: (item: CafeTable) => void;
  canManage: boolean;
}) {
  if (compact)
    return (
      <div className="qcafe-master-records">
        {items.map((item) => (
          <div key={item.uuid} className="qcafe-master-record">
            <button className="qcafe-master-record-main" onClick={() => onSelect?.(item)}>
              <span className="qcafe-master-thumb">
                <Armchair size={23} />
              </span>
              <span className="qcafe-master-record-copy">
                <strong>{item.name}</strong>
                <small>
                  {item.seats} seats · {item.status === "active" ? "Active" : "Inactive"}
                </small>
              </span>
            </button>
            {canManage && (
              <div className="qcafe-master-record-actions">
                <button aria-label={`Edit ${item.name}`} onClick={() => onEdit(item)}>
                  <Pencil size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="p-2">Table</th>
          <th>Seats</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.uuid} className="border-b">
            <td className="p-2">{item.name}</td>
            <td>{item.seats}</td>
            <td>
              <span
                className={item.status === "active" ? "text-emerald-700" : "text-muted-foreground"}
              >
                {item.status}
              </span>
            </td>
            <td>
              {canManage && (
                <Button variant="ghost" onClick={() => onEdit(item)}>
                  Edit
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
