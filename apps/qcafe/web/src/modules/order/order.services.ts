import { cloudRequest } from "../../web/transport";
import type { CafeOrder, OrderInput, MenuOption, TableOption, OccupiedSeat } from "./order.types";
export const listOrders = () => cloudRequest<CafeOrder[]>("/api/app/qcafe/orders");
export const updateOrder = (uuid: string, input: OrderInput) =>
  cloudRequest<CafeOrder>(`/api/app/qcafe/orders/${uuid}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
export const orderMenuLookup = () => cloudRequest<MenuOption[]>("/api/app/qcafe/menu");
export const orderTableLookup = () => cloudRequest<TableOption[]>("/api/app/qcafe/tables");
export const orderSeatLookup = () =>
  cloudRequest<OccupiedSeat[]>("/api/app/qcafe/orders/occupied-seats");
