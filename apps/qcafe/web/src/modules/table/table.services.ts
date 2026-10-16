import { cloudRequest } from "../../web/transport";
import type { CafeTable, TableInput } from "./table.types";
export const listTables = () => cloudRequest<CafeTable[]>("/api/app/qcafe/tables");
export const saveTable = (input: TableInput, uuid?: string) =>
  cloudRequest<CafeTable>(uuid ? `/api/app/qcafe/tables/${uuid}` : "/api/app/qcafe/tables", {
    method: uuid ? "PUT" : "POST",
    body: JSON.stringify(input)
  });
