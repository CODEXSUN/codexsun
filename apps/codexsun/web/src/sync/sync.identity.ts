// getRandomValues also works on HTTP LAN installations where randomUUID is unavailable.
export function createCodexsunClientKey(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
