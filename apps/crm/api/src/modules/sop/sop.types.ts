import type { ColumnType, Generated, Selectable } from "kysely";

export type SopStatus = "active" | "inactive";
export type SopInput = { code: string; title: string; purpose: string };
export type SopRecord = SopInput & {
  id: number;
  uuid: string;
  status: SopStatus;
  ownerUserId: number | null;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
export type SopRow = {
  id: Generated<number>;
  uuid: Generated<string>;
  code: string;
  title: string;
  purpose: string;
  status: SopStatus;
  owner_user_id: number | null;
  created_by: string;
  updated_by: string;
  created_at: ColumnType<string, string | undefined, never>;
  updated_at: ColumnType<string, string | undefined, string>;
};
export type SopDatabase = { crm_sops: SopRow };
export type SelectedSopRow = Selectable<SopRow>;
