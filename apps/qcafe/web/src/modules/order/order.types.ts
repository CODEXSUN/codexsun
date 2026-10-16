export type OrderLine = {
  menuUuid: string;
  code: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
};
export type OrderPatch = {
  name: string;
  mode: "POS" | "KOT" | "TAKE AWAY";
  tableUuid: string | null;
  seats: number[];
  lines: { menuUuid: string; quantity: number }[];
};
export type OrderInput = OrderPatch & {
  requestId: string;
  revision: number;
  action: "save" | "kitchen" | "bill" | "cancel";
};
export type KitchenTicket = {
  uuid: string;
  number: string;
  kind: "send" | "cancel";
  createdAt: string;
  lines: OrderLine[];
};
export type CafeOrder = Omit<OrderPatch, "lines"> & {
  uuid: string;
  revision: number;
  status: "draft" | "billed" | "cancelled";
  tableName: string;
  lines: OrderLine[];
  tickets: KitchenTicket[];
  billUuid: string | null;
};
export type MenuOption = {
  uuid: string;
  code: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string | undefined;
  status: "active" | "inactive";
};
export type TableOption = {
  uuid: string;
  name: string;
  seats: number;
  status: "active" | "inactive";
};
export type OccupiedSeat = { tableUuid: string; seat: number; orderUuid: string };
export type LastBill = { number: string; total: number; status: string };
