import { useState } from "react";
import { Layers, Plus } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { useMenu } from "./menu.hooks";
export function MenuCategories({
  canManage,
  onNewItem
}: {
  canManage: boolean;
  onNewItem: (category: string) => void;
}) {
  const menu = useMenu();
  const [chosen, setChosen] = useState("");
  const [search, setSearch] = useState("");
  const names = [...new Set(menu.items.map((item) => item.category))].sort((a, b) =>
    a.localeCompare(b)
  );
  const selected = names.includes(chosen) ? chosen : names[0];
  const items = menu.items.filter((item) => item.category === selected);
  return (
    <section className="qcafe-master-split">
      <section className="qcafe-master-panel">
        <header className="qcafe-master-panel-heading">
          <h2>
            Categories <span>{names.length}</span>
          </h2>
        </header>
        <div className="qcafe-master-search">
          <Input
            aria-label="Search categories"
            placeholder="Search categories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {menu.error && (
          <p role="alert" className="qcafe-master-error">
            {menu.error}
          </p>
        )}
        {names
          .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
          .map((name) => (
            <button
              key={name}
              className={`qcafe-master-category ${selected === name ? "is-selected" : ""}`}
              onClick={() => setChosen(name)}
            >
              <Layers size={18} />
              <strong>{name}</strong>
              <span>{menu.items.filter((item) => item.category === name).length} items</span>
            </button>
          ))}
        {!names.length && (
          <p className="qcafe-master-empty">Categories appear when you add them to an item.</p>
        )}
      </section>
      <section className="qcafe-master-panel">
        <header className="qcafe-master-panel-heading">
          <div>
            <h2>{selected || "Categories"}</h2>
            <p>Group related items so staff can find them quickly.</p>
          </div>
          {canManage && (
            <Button size="sm" onClick={() => onNewItem(selected ?? "")}>
              <Plus size={14} />
              New item
            </Button>
          )}
        </header>
        <div className="qcafe-master-editor">
          <p className="qcafe-master-help">
            Choose an existing category or enter a new category when you create or edit an item.
          </p>
          {items.map((item) => (
            <div key={item.uuid} className="qcafe-master-category-item">
              <div>
                <strong>{item.name}</strong>
                <small>
                  {item.code} · {item.status === "active" ? "Active" : "Inactive"}
                </small>
              </div>
              <b>₹{(item.price / 100).toFixed(2)}</b>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
