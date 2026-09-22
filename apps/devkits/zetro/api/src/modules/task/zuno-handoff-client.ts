import { zetroHandoffReceiptResponseSchema, type ZetroHandoffReceipt, type ZetroPreparedTaskHandoff } from "@codexsun/zetro-contracts";

export interface ZetroHandoffDelivery {
  deliver(handoff: ZetroPreparedTaskHandoff): Promise<ZetroHandoffReceipt>;
}

export class ZunoHandoffClient implements ZetroHandoffDelivery {
  constructor(private readonly baseUrl: string, private readonly clientKey: string, private readonly request: typeof fetch = fetch) {}

  async deliver(handoff: ZetroPreparedTaskHandoff): Promise<ZetroHandoffReceipt> {
    const response = await this.request(`${this.baseUrl}/api/v1/zuno/handoffs/zetro`, {
      body: JSON.stringify(handoff),
      headers: { "Content-Type": "application/json", "X-Zetro-Client-Key": this.clientKey },
      method: "POST",
      signal: AbortSignal.timeout(5_000),
    });
    const payload = await response.json() as unknown;
    if (!response.ok) {
      const error = payload as { error?: unknown };
      throw new Error(typeof error.error === "string" ? error.error : `Zuno rejected the handoff (${response.status}).`);
    }
    return zetroHandoffReceiptResponseSchema.parse(payload).data.receipt;
  }
}
