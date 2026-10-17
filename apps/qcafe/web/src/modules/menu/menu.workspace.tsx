import { useEffect, useState } from "react";
import { Plus, Save, Pencil } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@codexsun/ui/components/dialog";
import { useSpecialSettings } from "../special";
import { useMenu } from "./menu.hooks";
import { MenuForm } from "./menu.form";
import { MenuList } from "./menu.list";
import { saveMenu } from "./menu.services";
import type { MenuInput, MenuItem } from "./menu.types";
export function MenuWorkspace({
  canManage,
  initialCategory = ""
}: {
  canManage: boolean;
  initialCategory?: string;
}) {
  const menu = useMenu();
  const specials = useSpecialSettings();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [mode, setMode] = useState<"new" | "view" | "edit">("new");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  const [toggle, setToggle] = useState<MenuItem | null>(null);
  function start() {
    setSelected(null);
    setMode("new");
    setError("");
    setNotice("");
    setVersion((v) => v + 1);
  }
  useEffect(() => {
    start();
  }, [initialCategory]);
  async function save(input: MenuInput) {
    setBusy(true);
    setError("");
    try {
      const item = await saveMenu(input, selected?.uuid);
      setSelected(item);
      setMode("view");
      setVersion((v) => v + 1);
      setNotice("Item saved.");
      await menu.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save item.");
    } finally {
      setBusy(false);
    }
  }
  async function toggleStatus() {
    if (!toggle) return;
    setBusy(true);
    setError("");
    try {
      const { uuid, ...input } = toggle;
      const item = await saveMenu(
        { ...input, status: toggle.status === "active" ? "inactive" : "active" },
        uuid
      );
      if (selected?.uuid === uuid) {
        setSelected(item);
        setVersion((v) => v + 1);
      }
      setToggle(null);
      setNotice(item.status === "active" ? "Item is active." : "Item is hidden from POS.");
      await menu.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cannot change item status.");
    } finally {
      setBusy(false);
    }
  }
  const filtered = menu.items.filter((item) =>
    `${item.name} ${item.code} ${item.category}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <section className="qcafe-master-split">
      <section className="qcafe-master-panel">
        <header className="qcafe-master-panel-heading">
          <h2>
            Items <span>{menu.items.length}</span>
          </h2>
          {canManage && (
            <Button size="sm" disabled={busy || uploading} onClick={start}>
              <Plus size={14} />
              New item
            </Button>
          )}
        </header>
        <div className="qcafe-master-search">
          <Input
            aria-label="Search items in Master"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {menu.error && (
          <p role="alert" className="qcafe-master-error">
            {menu.error}
          </p>
        )}
        {menu.loading ? (
          <p role="status" className="qcafe-master-empty">
            Loading items…
          </p>
        ) : filtered.length ? (
          <MenuList
            items={filtered}
            selectedUuid={selected?.uuid}
            canManage={canManage}
            disabled={busy || uploading}
            onSelect={(item) => {
              setSelected(item);
              setMode("view");
              setError("");
              setNotice("");
            }}
            onEdit={(item) => {
              setSelected(item);
              setMode("edit");
              setError("");
              setNotice("");
            }}
            onToggle={setToggle}
          />
        ) : (
          <p className="qcafe-master-empty">
            {search ? "No matching items." : "No items yet. Add your first item."}
          </p>
        )}
      </section>
      <section className="qcafe-master-panel">
        <header className="qcafe-master-panel-heading">
          <div>
            <h2>{mode === "new" ? "New item" : mode === "edit" ? "Edit item" : selected?.name}</h2>
            <p>
              {mode === "view"
                ? "Item details. Choose Edit to make changes."
                : "Choose a category and enter the item’s name and price."}
            </p>
          </div>
          {canManage &&
            (mode === "view" ? (
              <Button
                key="edit-item"
                type="button"
                size="sm"
                disabled={busy || uploading}
                onClick={(event) => {
                  event.preventDefault();
                  setMode("edit");
                  setNotice("");
                }}
              >
                <Pencil size={14} />
                Edit
              </Button>
            ) : (
              <Button size="sm" type="submit" form="qcafe-menu-editor" disabled={busy || uploading}>
                <Save size={14} />
                {busy ? "Saving…" : "Save item"}
              </Button>
            ))}
        </header>
        <div className="qcafe-master-editor">
          {error && (
            <p role="alert" className="qcafe-master-error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="qcafe-master-notice">
              {notice}
            </p>
          )}
          <MenuForm
            key={`${selected?.uuid ?? "new"}:${mode}:${version}`}
            item={selected}
            busy={busy}
            onSave={save}
            onUploadBusy={setUploading}
            onCancel={start}
            formId="qcafe-menu-editor"
            embedded
            readOnly={!canManage || mode === "view"}
            initialCategory={initialCategory}
            categories={[...new Set(menu.items.map((item) => item.category))]}
            specialDefinitions={specials.settings?.definitions ?? []}
          />
        </div>
      </section>
      <Dialog
        open={!!toggle}
        onOpenChange={(open) => {
          if (!open && !busy) setToggle(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toggle?.status === "active" ? "Deactivate item?" : "Activate item?"}
            </DialogTitle>
            <DialogDescription>
              {toggle?.status === "active"
                ? "This hides the item from POS. Saved bills remain unchanged."
                : "This makes the item available for new orders."}
            </DialogDescription>
          </DialogHeader>
          {error && <p role="alert">{error}</p>}
          <Button variant="outline" disabled={busy || uploading} onClick={() => setToggle(null)}>
            Cancel
          </Button>
          <Button disabled={busy || uploading} onClick={() => void toggleStatus()}>
            {busy ? "Saving…" : "Confirm"}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
