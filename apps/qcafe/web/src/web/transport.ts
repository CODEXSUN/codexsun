const workspaceSlot = sessionStorage.getItem("codexsun.auth.slot");

export class CloudApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

export async function cloudRequest<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const slot = sessionStorage.getItem("codexsun.auth.slot");
  if (slot !== workspaceSlot)
    throw new Error("The Platform session changed. Reopen QCafe from the app launcher.");
  if (slot && /^[a-f0-9]{32}$/u.test(slot)) headers.set("x-codexsun-session-slot", slot);
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers, credentials: "include" });
  } catch {
    throw new Error(
      "Cannot reach Platform. Check your connection. Your unsaved order is still here."
    );
  }
  const result = await response.json();
  if (!response.ok) {
    const message =
      response.status === 401
        ? "Your Platform session has ended. Sign in to Platform again."
        : result.error?.message;
    throw new CloudApiError(message ?? "The request could not be completed.", response.status);
  }
  return result.data as T;
}
