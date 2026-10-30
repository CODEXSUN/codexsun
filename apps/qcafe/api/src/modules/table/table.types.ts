export type CafeTableSave = { name: string; seats: number; status: "active" | "inactive" };
export type CafeTable = CafeTableSave & { uuid: string };
