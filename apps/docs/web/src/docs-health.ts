import { docsHealthResponseSchema } from "@codexsun/docs-contracts";

export interface DocsHealthState {
  readonly status: "loading" | "online" | "offline";
  readonly message: string;
}

export async function loadDocsHealth(apiUrl: string | undefined): Promise<DocsHealthState> {
  if (!apiUrl) return { status: "offline", message: "Docs API URL is not configured." };

  try {
    const response = await fetch(`${apiUrl}/api/docs/v1/health`);
    if (!response.ok) return { status: "offline", message: "Docs API is unavailable." };
    const result = docsHealthResponseSchema.parse(await response.json());
    return { status: "online", message: `${result.data.providers.length} Docs providers are ready.` };
  } catch {
    return { status: "offline", message: "Docs API is unavailable." };
  }
}
