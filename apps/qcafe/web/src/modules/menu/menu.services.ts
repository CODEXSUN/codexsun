import { cloudRequest } from "../../web/transport";
import type { MenuInput, MenuItem } from "./menu.types";
export function listMenu() {
  return cloudRequest<MenuItem[]>("/api/app/qcafe/menu");
}
export async function saveMenu(input: MenuInput, uuid?: string) {
  const item = await cloudRequest<MenuItem>(
    uuid ? `/api/app/qcafe/menu/${uuid}` : "/api/app/qcafe/menu",
    {
      method: uuid ? "PUT" : "POST",
      body: JSON.stringify(input)
    }
  );
  window.dispatchEvent(new Event("qcafe-menu-updated"));
  return item;
}

export type MenuDemoPack = {
  version: "south-indian-v1";
  categories: string[];
  items: { code: string; name: string; category: string; price: number; imageUrl: string }[];
};
export const getMenuDemo = () => cloudRequest<MenuDemoPack>("/api/app/qcafe/menu/demo");
export async function importMenuDemo() {
  const result = await cloudRequest<{ added: number; skipped: number; categories: number }>(
    "/api/app/qcafe/menu/demo",
    { method: "POST", body: JSON.stringify({ version: "south-indian-v1" }) }
  );
  window.dispatchEvent(new Event("qcafe-menu-updated"));
  return result;
}
