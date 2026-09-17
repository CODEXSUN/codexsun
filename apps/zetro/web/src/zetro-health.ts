import { zetroHealthResponseSchema } from "@codexsun/zetro-contracts";

export interface ZetroHealthState {
  readonly status: "loading" | "online" | "offline";
  readonly message: string;
}

export async function loadZetroHealth(): Promise<ZetroHealthState> {
  try {
    const response = await fetch("/api/zetro/v1/health");
    if (!response.ok) return { status: "offline", message: "Zetro API is unavailable." };
    const result = zetroHealthResponseSchema.parse(await response.json());
    return { status: "online", message: `${result.data.providers.length} Zetro providers are ready.` };
  } catch {
    return { status: "offline", message: "Zetro API is unavailable." };
  }
}
