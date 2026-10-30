export const zetroAdminPages = ["patterns", "access", "conversations", "review"] as const;

export type SaZetroPage = `zetro/${(typeof zetroAdminPages)[number]}`;

export function zetroPageFromUrl(pathname: string): SaZetroPage | null {
  if (pathname === "/sa/zetro") return "zetro/patterns";
  const section = pathname.match(/^\/sa\/zetro\/([^/]+)$/)?.[1];
  return zetroAdminPages.some((page) => page === section)
    ? (`zetro/${section}` as SaZetroPage)
    : null;
}
