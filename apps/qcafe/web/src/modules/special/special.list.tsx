import { Trash2 } from "lucide-react";
import { Input } from "@codexsun/ui/components/input";
import type { SpecialDefinition } from "./special.types";
export function SpecialList({
  items,
  disabled,
  onChange
}: {
  items: SpecialDefinition[];
  disabled: boolean;
  onChange: (items: SpecialDefinition[]) => void;
}) {
  return (
    <div className="qcafe-special-list">
      {!items.length && <p>No special definitions yet. Add one above.</p>}
      {items.map((item, index) => (
        <div className="qcafe-special-row" key={index}>
          <Input
            aria-label={`Special prefix ${index + 1}`}
            value={item.prefix}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                items.map((row, i) =>
                  i === index ? { ...row, prefix: event.target.value.toUpperCase() } : row
                )
              )
            }
          />
          <Input
            aria-label={`Special name ${index + 1}`}
            value={item.name}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                items.map((row, i) => (i === index ? { ...row, name: event.target.value } : row))
              )
            }
          />
          <label>
            <input
              type="checkbox"
              checked={item.isEnabled}
              disabled={disabled}
              onChange={(event) =>
                onChange(
                  items.map((row, i) =>
                    i === index ? { ...row, isEnabled: event.target.checked } : row
                  )
                )
              }
            />{" "}
            Available
          </label>
          <button
            type="button"
            aria-label={`Remove ${item.name}`}
            disabled={disabled}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
