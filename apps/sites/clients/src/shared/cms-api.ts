type Envelope<T> = {
  data?: T;
  error?: { message?: string };
  success: boolean;
};

export async function cmsRequest<T>(
  path: string,
  options: { body?: unknown; method?: "DELETE" | "GET" | "POST" | "PUT" } = {}
) {
  const token = localStorage.getItem("cms.platform.token")?.trim();
  const response = await fetch(path, {
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    method: options.method ?? "GET"
  });
  const payload = (await response.json()) as Envelope<T>;
  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.error?.message || `CMS request failed (${response.status}).`);
  }
  return payload.data;
}
