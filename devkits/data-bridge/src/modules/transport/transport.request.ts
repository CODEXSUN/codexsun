type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { message: string }; meta?: { requestId?: string } };

export async function request<T>(path: string, body?: unknown) {
  const slot = sessionStorage.getItem("codexsun.auth.slot");
  const response = await fetch(`/api/data-bridge${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(slot ? { "x-codexsun-session-slot": slot } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const responseText = await response.text();
    if (/^\s*<!doctype html|^\s*<html/iu.test(responseText)) {
      throw new Error(
        "The Data Bridge API returned the web app page instead of JSON. Check that the Platform API is running and the /api/data-bridge proxy is active."
      );
    }
    throw new Error(`The Data Bridge API returned a non-JSON response (${response.status}).`);
  }
  let envelope: Envelope<T>;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    throw new Error(`The Data Bridge API returned invalid JSON (${response.status}).`);
  }
  if (!response.ok || !envelope.success) {
    const message = envelope.success
      ? `Request failed (${response.status}).`
      : envelope.error.message;
    const requestId = envelope.success ? undefined : envelope.meta?.requestId;
    throw new Error(requestId ? `${message} (Request ID: ${requestId})` : message);
  }
  return envelope.data;
}
