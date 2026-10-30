export type Waiter = { uuid: string; code: string; name: string; status: "active" | "inactive" };
export type WaiterSave = Omit<Waiter, "uuid">;
