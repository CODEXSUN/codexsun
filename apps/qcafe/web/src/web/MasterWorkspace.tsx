import { useState } from "react";
import { MenuWorkspace, MenuCategories } from "../modules/menu";
import { TableWorkspace } from "../modules/table";
import "./master.css";
export function MasterWorkspace({
  canManageMenu,
  canManageTables
}: {
  canManageMenu: boolean;
  canManageTables: boolean;
}) {
  const [tab, setTab] = useState("Items");
  const [category, setCategory] = useState("");
  const [version, setVersion] = useState(0);
  return (
    <section className="qcafe-master">
      <nav className="qcafe-master-tabs" aria-label="Master sections" role="tablist">
        {["Items", "Categories", "Restaurant Tables"].map((name) => (
          <button key={name} role="tab" aria-selected={tab === name} onClick={() => setTab(name)}>
            {name}
          </button>
        ))}
      </nav>
      <div role="tabpanel" aria-label="Items" hidden={tab !== "Items"}>
        <MenuWorkspace key={version} canManage={canManageMenu} initialCategory={category} />
      </div>
      <div role="tabpanel" aria-label="Categories" hidden={tab !== "Categories"}>
        <MenuCategories
          canManage={canManageMenu}
          onNewItem={(name) => {
            setCategory(name);
            setVersion((v) => v + 1);
            setTab("Items");
          }}
        />
      </div>
      <div role="tabpanel" aria-label="Restaurant Tables" hidden={tab !== "Restaurant Tables"}>
        <TableWorkspace canManage={canManageTables} inline />
      </div>
    </section>
  );
}
