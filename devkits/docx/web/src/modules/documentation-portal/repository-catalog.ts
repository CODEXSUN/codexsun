export type RepositoryDocument = { path: string; owner: string; group: string; title: string; content: string };

export function createDocumentCatalog(files: Record<string, string>): RepositoryDocument[] {
  return Object.entries(files).map(([source, content]) => {
    const path = source.replace(/^(?:\.\.\/)+/, "");
    const parts = path.split("/");
    const group = ({ apps: "Applications", devkits: "Devkits", core: "Platform", packages: "Packages", assist: "Assist" } as Record<string, string>)[parts[0]] ?? "Repository";
    const owner = parts.length > 2 ? parts.slice(0, 2).join("/") : parts.length === 2 ? parts[0] : "Repository";
    const title = /^#\s+(.+)$/m.exec(content)?.[1]?.trim() || parts.at(-1)!;
    return { path, owner, group, title, content };
  }).sort((a, b) => {
    const groups = ["Applications", "Devkits", "Platform", "Packages", "Assist", "Repository"];
    return groups.indexOf(a.group) - groups.indexOf(b.group) || a.owner.localeCompare(b.owner)
      || Number(b.path === `${b.owner}/README.md`) - Number(a.path === `${a.owner}/README.md`)
      || a.path.localeCompare(b.path);
  });
}

export function resolveDocumentLink(currentPath: string, href: string): string | undefined {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(href)) return undefined;
  const url = new URL(href, `https://repository.invalid/${currentPath}`);
  return decodeURIComponent(url.pathname.slice(1));
}
