import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@codexsun/ui/components/dialog";
import { TableForm } from "./table.form";
import { TableList } from "./table.list";
import { useTables } from "./table.hooks";
import { saveTable } from "./table.services";
import type { CafeTable, TableInput } from "./table.types";
export function TableWorkspace({
  canManage,
  onChanged,
  inline = false
}: {
  canManage: boolean;
  inline?: boolean;
  onChanged?: () => void;
}) {
  const tables = useTables();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CafeTable | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(input: TableInput) {
    setBusy(true);
    setError("");
    try {
      const saved = await saveTable(input, selected?.uuid);
      setSelected(saved);
      setOpen(false);
      await tables.refresh();
      onChanged?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot save table.");
    } finally {
      setBusy(false);
    }
  }
  if (inline)
    return (
      <section className="qcafe-master-split">
        <section className="qcafe-master-panel">
          <header className="qcafe-master-panel-heading">
            <h2>
              Restaurant Tables <span>{tables.items.length}</span>
            </h2>
            {canManage && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => {
                  setSelected(null);
                  setOpen(true);
                  setError("");
                }}
              >
                + New table
              </Button>
            )}
          </header>
          {tables.error && (
            <p role="alert" className="qcafe-master-error">
              {tables.error}
            </p>
          )}
          <TableList
            items={tables.items}
            canManage={canManage}
            compact
            onSelect={(item) => {
              setSelected(item);
              setOpen(false);
              setError("");
            }}
            onEdit={(item) => {
              setSelected(item);
              setOpen(true);
              setError("");
            }}
          />
          {!tables.items.length && (
            <p className="qcafe-master-empty">No tables yet. Add your first restaurant table.</p>
          )}
        </section>
        <section className="qcafe-master-panel">
          <header className="qcafe-master-panel-heading">
            <div>
              <h2>{selected ? (open ? "Edit table" : selected.name) : "New table"}</h2>
              <p>Give the table a name and set the number of seats.</p>
            </div>
            {canManage &&
              (selected && !open ? (
                <Button
                  key="edit-table"
                  type="button"
                  size="sm"
                  onClick={(event) => {
                    event.preventDefault();
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
              ) : (
                <Button size="sm" type="submit" form="qcafe-table-editor" disabled={busy}>
                  {busy ? "Saving…" : "Save table"}
                </Button>
              ))}
          </header>
          <div className="qcafe-master-editor">
            {error && (
              <p role="alert" className="qcafe-master-error">
                {error}
              </p>
            )}
            <TableForm
              key={`${selected?.uuid ?? "new"}:${open}`}
              item={selected}
              busy={busy}
              onSave={save}
              onCancel={() => setOpen(false)}
              formId="qcafe-table-editor"
              embedded
              readOnly={!canManage || (!!selected && !open)}
            />
          </div>
        </section>
      </section>
    );
  return (
    <section className="grid gap-4">
      <div className="flex justify-between">
        <h2 className="font-semibold">Restaurant tables</h2>
        {canManage && (
          <Button
            onClick={() => {
              setSelected(null);
              setOpen(true);
              setError("");
            }}
          >
            New table
          </Button>
        )}
      </div>
      {tables.error && <p role="alert">{tables.error}</p>}
      <TableList
        items={tables.items}
        canManage={canManage}
        onEdit={(item) => {
          setSelected(item);
          setOpen(true);
          setError("");
        }}
      />
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected ? "Edit table" : "New table"}</DialogTitle>
            <DialogDescription>
              Set the table name and seat capacity. Deactivate a table to stop new assignments.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p role="alert" className="text-red-600">
              {error}
            </p>
          )}
          <TableForm
            key={selected?.uuid ?? "new"}
            item={selected}
            busy={busy}
            onSave={save}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
