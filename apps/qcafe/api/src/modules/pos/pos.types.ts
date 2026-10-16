import type { Kysely } from "kysely";
import type { QCafeDatabase, QCafeDependencies } from "../../cloud/runtime.js";

export type PosInput = { requestId: string; lines: { menuUuid: string; quantity: number }[] };
export type PaymentInput = {
  requestId: string;
  amount: number;
  mode: "cash" | "card" | "upi" | "bank" | "other";
  reference: string;
};
export type PosMenuOption = { uuid: string; code: string; name: string; price: number };
export type PosDependencies = QCafeDependencies & {
  releaseSeats?: ((database: Kysely<QCafeDatabase>, billUuid: string) => Promise<void>) | undefined;
  lookupMenu: (database: Kysely<QCafeDatabase>, uuids: string[]) => Promise<PosMenuOption[]>;
};
export type PosLine = {
  menuUuid: string;
  code: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
};
export type PosPayment = {
  uuid: string;
  amount: number;
  mode: PaymentInput["mode"];
  reference: string;
  createdAt: string;
};
export type PosBill = {
  serviceContext: { orderUuid: string; mode: string; tableName: string; seats: number[] } | null;
  uuid: string;
  number: string;
  total: number;
  paid: number;
  status: "open" | "part-paid" | "paid";
  createdAt: string;
  lines: PosLine[];
  payments: PosPayment[];
};
