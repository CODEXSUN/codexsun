import { cloudRequest } from "../../web/transport";
import type { Waiter } from "./waiter.types";
export const listWaiters = () => cloudRequest<Waiter[]>("/api/app/qcafe/waiters");
export const saveWaiter = (input: Omit<Waiter, "uuid">, uuid?: string) =>
  cloudRequest<Waiter>(`/api/app/qcafe/waiters${uuid ? `/${uuid}` : ""}`, {
    method: uuid ? "PUT" : "POST",
    body: JSON.stringify(input)
  });
