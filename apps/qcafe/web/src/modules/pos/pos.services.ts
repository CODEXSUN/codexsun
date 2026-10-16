import { cloudRequest } from "../../web/transport";
import type { PosBill, PosInput, PaymentInput } from "./pos.types";
export function listPosBills() {
  return cloudRequest<PosBill[]>("/api/app/qcafe/pos");
}
export function createPosBill(input: PosInput) {
  return cloudRequest<PosBill>("/api/app/qcafe/pos", {
    method: "POST",
    body: JSON.stringify(input)
  });
}
export function collectPosPayment(uuid: string, input: PaymentInput) {
  return cloudRequest<PosBill>(`/api/app/qcafe/pos/${uuid}/payments`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export const getPosBill = (uuid: string) => cloudRequest<PosBill>(`/api/app/qcafe/pos/${uuid}`);
