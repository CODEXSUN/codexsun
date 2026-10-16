export function ecommerceFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const slot = window.sessionStorage.getItem("codexsun.auth.slot");
  if (slot) headers.set("x-codexsun-session-slot", slot);
  return fetch(input, { ...init, headers, credentials: "include" });
}
