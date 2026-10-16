const SESSION_SLOT_KEY = "codexsun.auth.slot";

export function getSessionSlot(): string | null {
  try {
    const slot = sessionStorage.getItem(SESSION_SLOT_KEY);
    return slot && /^[0-9a-f]{32}$/u.test(slot) ? slot : null;
  } catch {
    return null;
  }
}

export function setSessionSlot(slot: string): void {
  if (!/^[0-9a-f]{32}$/u.test(slot)) throw new Error("Invalid browser session slot.");
  sessionStorage.setItem(SESSION_SLOT_KEY, slot);
}

export function clearSessionSlot(): void {
  sessionStorage.removeItem(SESSION_SLOT_KEY);
}

export function isPlatformApiRequest(input: RequestInfo | URL): boolean {
  try {
    const apiBaseUrl = window.__CODEXSUN_RUNTIME_CONFIG__?.VITE_PLATFORM_API_URL;
    if (typeof apiBaseUrl !== "string") return false;
    const base = new URL(apiBaseUrl, window.location.href);
    const raw = input instanceof Request ? input.url : String(input);
    const url = new URL(raw, window.location.href);
    const prefix = base.pathname.replace(/\/$/u, "");
    return (
      url.origin === base.origin &&
      (url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))
    );
  } catch {
    return false;
  }
}
