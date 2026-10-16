import { useState } from "react";
import { Pencil, Power, Utensils } from "lucide-react";
import type { MenuItem } from "./menu.types";
export function MenuList({
  items,
  selectedUuid,
  onSelect,
  onEdit,
  onToggle,
  canManage,
  disabled = false
}: {
  items: MenuItem[];
  selectedUuid: string | undefined;
  onSelect: (item: MenuItem) => void;
  onEdit: (item: MenuItem) => void;
  onToggle: (item: MenuItem) => void;
  canManage: boolean;
  disabled?: boolean;
}) {
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  return (
    <div className="qcafe-master-records">
      {items.map((item) => (
        <div
          key={item.uuid}
          className={`qcafe-master-record ${selectedUuid === item.uuid ? "is-selected" : ""}`}
        >
          <button
            className="qcafe-master-record-main"
            disabled={disabled}
            onClick={() => onSelect(item)}
          >
            <span className="qcafe-master-thumb">
              {item.imageUrl && !failed[item.imageUrl] ? (
                <img
                  src={item.imageUrl}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() => setFailed((current) => ({ ...current, [item.imageUrl!]: true }))}
                />
              ) : (
                <Utensils size={20} />
              )}
            </span>
            <span className="qcafe-master-record-copy">
              <strong>{item.name}</strong>
              <small>
                {item.code} · {item.category}
                {item.status === "inactive" ? " · Inactive" : ""}
              </small>
            </span>
            <b>₹{(item.price / 100).toFixed(2)}</b>
          </button>
          {canManage && (
            <div className="qcafe-master-record-actions">
              <button
                aria-label={`Edit ${item.name}`}
                title="Edit item"
                disabled={disabled}
                onClick={() => onEdit(item)}
              >
                <Pencil size={16} />
              </button>
              <button
                aria-label={`${item.status === "active" ? "Deactivate" : "Activate"} ${item.name}`}
                title={item.status === "active" ? "Deactivate item" : "Activate item"}
                disabled={disabled}
                onClick={() => onToggle(item)}
              >
                <Power size={16} />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
