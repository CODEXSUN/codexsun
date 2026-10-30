import type { Kysely } from "kysely";
import type { QCafeDatabase, QCafeDependencies } from "../../cloud/runtime.js";
export type MenuSpecialPrice = { prefix: string; price: number; isEnabled: boolean };
export type MenuSpecialPolicy = {
  enabled: boolean;
  selectedPrefix: string;
  definitions: { prefix: string; name: string; isEnabled: boolean }[];
};
export type MenuDependencies = QCafeDependencies & {
  settingsPolicy: (database: Kysely<QCafeDatabase>) => Promise<{ imageWriteProtection: boolean }>;
  specialPolicy: (database: Kysely<QCafeDatabase>) => Promise<MenuSpecialPolicy>;
};
export type MenuSave = {
  code: string;
  name: string;
  category: string;
  imageUrl?: string | undefined;
  specialPrices?: MenuSpecialPrice[] | undefined;
  price: number;
  status: "active" | "inactive";
};
export type MenuItem = MenuSave & { uuid: string; specialPrices: MenuSpecialPrice[] };
