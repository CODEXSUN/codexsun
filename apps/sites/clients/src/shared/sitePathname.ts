export function sitePathname() {
  return typeof window !== "undefined"
    ? window.location.pathname
    : ((globalThis as unknown as { __CODEXSUN_SITES_PATHNAME__?: string })
        .__CODEXSUN_SITES_PATHNAME__ ?? "/");
}
