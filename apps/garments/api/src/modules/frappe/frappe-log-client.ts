import { garmentsFrappeLogsSchema, type FrappeApiLog } from "@codexsun/garments-contracts";
import type { GarmentsApiRuntimeConfig } from "@codexsun/platform-core/runtime-config";

const apiLogRequest = {
  doctype: "API One Log",
  fields: ["name", "creation", "request_content"],
  filters: [["api_path", "=", "apparel-log"]],
  limit: 1000,
  order_by: "creation desc",
};

interface FrappeListResponse {
  readonly data?: unknown;
  readonly message?: unknown;
}

export class FrappeLogClient {
  public constructor(
    private readonly configuration: Pick<GarmentsApiRuntimeConfig, "GARMENTS_FRAPPE_TOKEN" | "GARMENTS_FRAPPE_URL">,
    private readonly request: typeof fetch = fetch,
  ) {}

  public async listApparelLogs(): Promise<{ fetchedAt: string; logs: FrappeApiLog[] }> {
    if (!this.configuration.GARMENTS_FRAPPE_TOKEN) {
      throw new FrappeLogConfigurationError();
    }

    const response = await this.request(new URL("/api/v2/method/frappe.client.get_list", this.configuration.GARMENTS_FRAPPE_URL), {
      body: JSON.stringify(apiLogRequest),
      headers: {
        authorization: `token ${this.configuration.GARMENTS_FRAPPE_TOKEN}`,
        "content-type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new FrappeLogRequestError(response.status);
    }

    const body = (await response.json()) as FrappeListResponse;
    return garmentsFrappeLogsSchema.parse({ fetchedAt: new Date().toISOString(), logs: body.data ?? body.message });
  }
}

export class FrappeLogRequestError extends Error {
  public constructor(public readonly statusCode: number) {
    super(`Frappe log request failed with status ${statusCode}.`);
  }
}

export class FrappeLogConfigurationError extends Error {
  public constructor() {
    super("GARMENTS_FRAPPE_TOKEN is not configured.");
  }
}
