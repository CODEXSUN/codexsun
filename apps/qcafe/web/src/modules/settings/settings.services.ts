import { cloudRequest } from "../../web/transport";
import type { CafeSettings } from "./settings.types";
export const getCafeSettings = () => cloudRequest<CafeSettings>("/api/app/qcafe/settings");
export async function saveCafeSettings(input: CafeSettings) {
  const saved = await cloudRequest<CafeSettings>("/api/app/qcafe/settings", {
    method: "PUT",
    body: JSON.stringify(input)
  });
  window.dispatchEvent(new Event("qcafe-settings-updated"));
  return saved;
}
