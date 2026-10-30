import { Plus, Trash2 } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
export type SpecialPriceDraft = { prefix: string; price: string; isEnabled: boolean };
export function MenuSpecialPrices({
  items,
  definitions,
  disabled,
  onChange
}: {
  items: SpecialPriceDraft[];
  definitions: { prefix: string; name: string }[];
  disabled: boolean;
  onChange: (items: SpecialPriceDraft[]) => void;
}) {
  return (
    <section className="qcafe-menu-special">
      <header>
        <div>
          <h3>Special prices</h3>
          <p>POS uses the Today Special selected in Settings.</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={disabled || definitions.length === 0 || items.length >= definitions.length}
          onClick={() => onChange([...items, { prefix: "", price: "", isEnabled: true }])}
        >
          <Plus size={14} />
          Add special
        </Button>
      </header>
      {!definitions.length && <p>Add a Today Special definition in Settings first.</p>}
      {items.map((item, index) => (
        <div key={index} className="qcafe-menu-special-row">
          <select
            aria-label={`Today Special ${index + 1}`}
            value={item.prefix}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                items.map((row, i) => (i === index ? { ...row, prefix: event.target.value } : row))
              )
            }
          >
            <option value="">Select Today Special</option>
            {item.prefix && !definitions.some((row) => row.prefix === item.prefix) && (
              <option value={item.prefix}>{item.prefix} · Removed in Settings</option>
            )}
            {definitions.map((definition) => (
              <option
                key={definition.prefix}
                value={definition.prefix}
                disabled={items.some((row, i) => i !== index && row.prefix === definition.prefix)}
              >
                {definition.prefix} · {definition.name}
              </option>
            ))}
          </select>
          <Input
            aria-label={`Special price ${index + 1}`}
            inputMode="decimal"
            placeholder="Price (₹)"
            value={item.price}
            disabled={disabled}
            onChange={(event) =>
              onChange(
                items.map((row, i) => (i === index ? { ...row, price: event.target.value } : row))
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
            />
            Use in POS
          </label>
          <button
            type="button"
            aria-label={`Remove special price ${index + 1}`}
            disabled={disabled}
            onClick={() => onChange(items.filter((_, i) => i !== index))}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </section>
  );
}
