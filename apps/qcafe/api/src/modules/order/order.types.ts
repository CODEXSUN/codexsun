import type { Kysely } from "kysely";
import type { QCafeDatabase, QCafeDependencies } from "../../cloud/runtime.js";
export type BookingDetails = { customerName: string; mobile: string; pickupAt: string };
export type OrderLine = {
  menuUuid: string;
  code: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
};
export type OrderInput = {
  booking?: BookingDetails | null | undefined;
  requestId: string;
  revision: number;
  action: "save" | "kitchen" | "bill" | "cancel";
  name: string;
  mode: "POS" | "KOT" | "TAKE AWAY";
  tableUuid: string | null;
  seats: number[];
  lines: { menuUuid: string; quantity: number }[];
};
export type KitchenTicket = {
  uuid: string;
  number: string;
  kind: "send" | "cancel";
  createdAt: string;
  lines: OrderLine[];
};
export type CafeOrder = {
  booking: BookingDetails | null;
  bookingToken: string | null;
  parcelToken: string | null;
  uuid: string;
  name: string;
  revision: number;
  status: "draft" | "billed" | "cancelled";
  mode: OrderInput["mode"];
  tableUuid: string | null;
  tableName: string;
  seats: number[];
  lines: OrderLine[];
  tickets: KitchenTicket[];
  billUuid: string | null;
};
export type OrderDependencies = QCafeDependencies & {
  lookupMenu: (
    database: Kysely<QCafeDatabase>,
    uuids: string[]
  ) => Promise<{ uuid: string; code: string; name: string; price: number }[]>;
  lockTable: (
    database: Kysely<QCafeDatabase>,
    uuid: string
  ) => Promise<{ uuid: string; name: string; seats: number; status: string } | null>;
  createBill: (
    database: Kysely<QCafeDatabase>,
    input: {
      requestId: string;
      lines: OrderLine[];
      context: {
        orderUuid: string;
        mode: string;
        tableName: string;
        seats: number[];
        parcelToken: string | null;
        booking: (BookingDetails & { token: string }) | null;
      };
    },
    actor: string
  ) => Promise<{ uuid: string }>;
};
