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
