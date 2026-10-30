import { cloudRequest } from "../../web/transport";
import type { SpecialSettings } from "./special.types";
export const getSpecialSettings = () => cloudRequest<SpecialSettings>("/api/app/qcafe/specials");
export async function saveSpecialSettings(input: SpecialSettings) {
  const saved = await cloudRequest<SpecialSettings>("/api/app/qcafe/specials", {
    method: "PUT",
    body: JSON.stringify(input)
  });
  window.dispatchEvent(new Event("qcafe-specials-updated"));
  window.dispatchEvent(new Event("qcafe-menu-updated"));
  return saved;
}
