export type PosMenuOption = {
  uuid: string;
  code: string;
  name: string;
  category: string;
  imageUrl?: string | undefined;
  price: number;
  status: "active" | "inactive";
};
export type DraftLine = { menuUuid: string; quantity: number };
export type PaymentMode = "cash" | "card" | "upi" | "bank" | "other";
export type PosBill = {
  serviceContext: { orderUuid: string; mode: string; tableName: string; seats: number[] } | null;
  uuid: string;
  number: string;
  total: number;
  paid: number;
  status: "open" | "part-paid" | "paid";
  createdAt: string;
  lines: {
    menuUuid: string;
    code: string;
    name: string;
    quantity: number;
    rate: number;
    amount: number;
  }[];
  payments: {
    uuid: string;
    amount: number;
    mode: PaymentMode;
    reference: string;
    createdAt: string;
  }[];
};
export type PosInput = { requestId: string; lines: DraftLine[] };
export type PaymentInput = {
  requestId: string;
  amount: number;
  mode: PaymentMode;
  reference: string;
};
