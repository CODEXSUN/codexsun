import assert from "node:assert/strict";
import { env } from "../../apps/platform/api/src/env.js";
const origin = `http://127.0.0.1:${env.PLATFORM_API_PORT}`;
if (env.NODE_ENV !== "development")
  throw new Error("This test requires the configured local development environment.");
export class TconnectTestSession {
  private cookie = "";
  private slot = "";
  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    extraHeaders: Record<string, string> = {}
  ) {
    const response = await fetchWhenReady(`${origin}${path}`, {
      method,
      headers: {
        Origin: origin,
        "Content-Type": "application/json",
        ...(this.cookie ? { Cookie: this.cookie, "x-codexsun-session-slot": this.slot } : {}),
        ...extraHeaders
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const json = (await response.json()) as {
      success: boolean;
      data: T;
      error?: { message: string };
    };
    if (path === "/auth/login" && response.ok) {
      this.cookie = response.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      this.slot = (json.data as { sessionSlot: string }).sessionSlot;
    }
    return { status: response.status, data: json.data, success: json.success };
  }
  async login(email: string, password: string) {
    const result = await this.request("POST", "/auth/login", {
      desk: "tenant",
      corporateId: env.DEFAULT_TENANT_CORPORATE_ID,
      email,
      password
    });
    assert.equal(result.status, 200, "Platform cookie login must succeed");
  }
}
async function fetchWhenReady(url: string, options: RequestInit) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
    } catch (error) {
      const code = (error as { cause?: { code?: string } }).cause?.code;
      // Refused connections never accepted the request. Do not replay other failed writes.
      if (code !== "ECONNREFUSED" || attempt >= 40) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
