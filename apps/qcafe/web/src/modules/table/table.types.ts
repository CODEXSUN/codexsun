export type TableInput = { name: string; seats: number; status: "active" | "inactive" };
export type CafeTable = TableInput & { uuid: string };
