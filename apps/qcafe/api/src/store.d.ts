export type CafeUser = {
  id: number;
  login: string;
  name: string;
  role: "owner" | "manager" | "cashier" | "waiter" | "kitchen";
};

export class CafeStore {
  constructor(path: string);
  db: { close(): void };
  snapshot(): Record<string, unknown>;
  hasStaffUsers(): boolean;
  setupOwner(input: Record<string, unknown>): CafeUser;
  signInPin(pin: string): CafeUser;
  signInCloudPin(pin: string): CafeUser;
  signInStaff(login: string, pin: string): CafeUser;
  order(input: Record<string, unknown>): unknown;
  createPos(input: Record<string, unknown>): unknown;
  recordReceipt(input: Record<string, unknown>): unknown;
  advance(input: Record<string, unknown>): unknown;
  adjust(input: Record<string, unknown>): unknown;
  book(input: Record<string, unknown>): unknown;
  saveCategory(input: Record<string, unknown>): unknown;
  deleteCategory(input: Record<string, unknown>): unknown;
  saveItem(input: Record<string, unknown>): unknown;
  deleteItem(input: Record<string, unknown>): unknown;
  saveRestaurantTable(input: Record<string, unknown>): unknown;
  deleteRestaurantTable(input: Record<string, unknown>): unknown;
  saveMasterSetting(input: Record<string, unknown>): unknown;
}
