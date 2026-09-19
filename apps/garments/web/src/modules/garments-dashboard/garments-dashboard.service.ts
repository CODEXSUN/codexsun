import { garmentsFrappeLogsResponseSchema, type FrappeApiLog } from "@codexsun/garments-contracts";

const apiUrl = import.meta.env.VITE_GARMENTS_API_URL.replace(/\/$/, "");

export type GarmentLog = FrappeApiLog;

export async function fetchFrappeLogs(): Promise<{ fetchedAt: string; logs: GarmentLog[] }> {
  const response = await fetch(`${apiUrl}/api/garments/v1/frappe/logs`);
  if (!response.ok) throw new Error("Could not retrieve apparel logs from Frappe.");
  return garmentsFrappeLogsResponseSchema.parse(await response.json()).data;
}
