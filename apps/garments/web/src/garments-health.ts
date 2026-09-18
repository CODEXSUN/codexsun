import { garmentsHealthResponseSchema } from "@codexsun/garments-contracts";

export interface GarmentsHealthState {
  readonly status: "loading" | "online" | "offline";
  readonly message: string;
}

export async function loadGarmentsHealth(apiUrl: string | undefined): Promise<GarmentsHealthState> {
  if (!apiUrl) return { status: "offline", message: "Garments API URL is not configured." };

  try {
    const response = await fetch(`${apiUrl}/api/garments/v1/health`);
    if (!response.ok) return { status: "offline", message: "Garments API is unavailable." };
    const result = garmentsHealthResponseSchema.parse(await response.json());
    return { status: "online", message: `${result.data.providers.length} Garments providers are ready.` };
  } catch {
    return { status: "offline", message: "Garments API is unavailable." };
  }
}
