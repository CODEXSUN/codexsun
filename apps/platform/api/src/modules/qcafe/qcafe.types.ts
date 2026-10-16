export type QCafeCloudSession = {
  expiresAt: number;
  tenantId: string;
  user: {
    id: number;
    login: string;
    name: string;
    role: "owner" | "manager" | "cashier" | "waiter" | "kitchen";
  };
};
