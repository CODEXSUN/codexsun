export async function publicRequest<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/platform${path}`, {
    ...(body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      : {}),
    signal: AbortSignal.timeout(12000),
    credentials: "same-origin"
  });
  const result = await response.json().catch(() => {
    throw new Error("TConnect is temporarily unavailable. Please try again.");
  });
  if (!response.ok || !result.success)
    throw new Error(result.error?.message ?? "TConnect could not load this information.");
  return result.data as T;
}
