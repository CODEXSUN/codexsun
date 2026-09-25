export type PinStatus = {
  cashierLogin: string;
  pinSet: boolean;
  supported: boolean;
};

export type PinSession = {
  actor: { id: string; kind: string; permissions: string[]; roles: string[] };
  session: { expiresAt: string; id: string };
  token: string;
};

const BROWSER_SESSION_KEY = "codexsun.qcafe.browser-session";
const IDENTITY_SESSION_KEY = "codexsun.qcafe.identity-session";

export function readBrowserSessionId(): string {
  const existing = window.sessionStorage.getItem(BROWSER_SESSION_KEY);
  if (existing) return existing;
  const value = crypto.randomUUID();
  window.sessionStorage.setItem(BROWSER_SESSION_KEY, value);
  return value;
}

export function writeIdentitySession(session: { expiresAt: string; roles: readonly string[]; token: string }): void {
  window.sessionStorage.setItem(IDENTITY_SESSION_KEY, JSON.stringify(session));
}

async function pinRequest<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      "content-type": "application/json",
      "x-codexsun-browser-session": readBrowserSessionId(),
    },
    method: body ? "POST" : "GET",
    signal: AbortSignal.timeout(8_000),
  });
  if (response.status === 404) {
    const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new FirstSetupRequiredError(payload?.error ?? "First setup required.");
  }
  if (!response.ok) {
    const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
    throw new Error(payload?.error ?? `PIN request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export class FirstSetupRequiredError extends Error {}

export function readPinStatus(): Promise<PinStatus> {
  return pinRequest<PinStatus>("/api/v1/qcafe/auth/pin");
}

export function setupCashierPin(pin: string): Promise<{ cashierLogin: string }> {
  return pinRequest<{ cashierLogin: string }>("/api/v1/qcafe/auth/pin/setup", { pin });
}

export function signInWithPin(pin: string): Promise<PinSession> {
  return pinRequest<PinSession>("/api/v1/qcafe/auth/pin/login", { pin });
}

export function signInWithUsername(identifier: string, password: string): Promise<PinSession> {
  return pinRequest<PinSession>("/api/v1/qcafe/auth/login", { identifier, password });
}
