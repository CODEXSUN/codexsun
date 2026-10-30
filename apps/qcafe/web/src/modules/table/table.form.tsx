import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { tableSchema } from "./table.schema";
import type { CafeTable, TableInput } from "./table.types";
export function TableForm({
  item,
  busy,
  onSave,
  onCancel,
  formId,
  embedded = false,
  readOnly = false
}: {
  item: CafeTable | null;
  formId?: string;
  embedded?: boolean;
  readOnly?: boolean;
  busy: boolean;
  onSave: (input: TableInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [seats, setSeats] = useState(item?.seats ?? 4);
  const [status, setStatus] = useState<TableInput["status"]>(item?.status ?? "active");
  const [error, setError] = useState("");
  return (
    <form
      id={formId}
      className={embedded ? "qcafe-master-item-form" : "grid gap-4"}
      onSubmit={(event) => {
        event.preventDefault();
        if (readOnly) return;
        const parsed = tableSchema.safeParse({ name, seats, status });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Check the fields.");
          return;
        }
        void onSave(parsed.data);
      }}
    >
      <label>
        Table name *
        <Input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy || readOnly}
        />
      </label>
      <label>
        Seats *
        <Input
          type="number"
          min={1}
          max={50}
          required
          value={seats}
          onChange={(e) => setSeats(Number(e.target.value))}
          disabled={busy || readOnly}
        />
      </label>
      <label>
        Status
        <select
          aria-label="Table status"
          value={status}
          onChange={(e) => setStatus(e.target.value === "inactive" ? "inactive" : "active")}
          disabled={busy || readOnly}
          className="ml-3 rounded border p-2"
        >
          <option>active</option>
          <option>inactive</option>
        </select>
      </label>
      {error && <p role="alert">{error}</p>}
      {!embedded && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={busy || readOnly} onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={busy || readOnly}>{busy ? "Saving…" : "Save table"}</Button>
        </div>
      )}
    </form>
  );
}
