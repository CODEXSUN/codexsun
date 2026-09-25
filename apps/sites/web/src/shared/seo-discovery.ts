import { publicRoutePaths, standaloneRoutePaths } from "./client-routes";

export const publicClientSlugs = ["codexsun", "devxcrew", "skilloopz", "logicx"] as const;

export function createRobots(origin: string, standaloneSlug?: string): string {
  const allow = standaloneSlug ? "/" : "/clients/";
  return `User-agent: *\nAllow: ${allow}\nDisallow: /clients/test\nDisallow: /api/\nDisallow: /api/internal/\nSitemap: ${origin}/sitemap.xml\n`;
}

export function createAiTxt(origin: string): string {
  return `# Sites\n\nSites is a modular hosting CMS and public client portfolio portal.\n\n## Public client spaces\n${publicClientSlugs.map((slug) => `- ${origin}/clients/${slug}`).join("\n")}\n\n## Usage\nPublic page content may be summarized with attribution. Do not infer private CMS content from public pages.\n`;
}

export function createLlmsTxt(origin: string): string {
  return `# Sites\n\n> A modular hosting CMS for fast, flexible client websites.\n\n## Public pages\n- [Client portal](${origin}/clients): Browse the public client spaces.\n${publicClientSlugs.map((slug) => `- [${slug}](${origin}/clients/${slug}): Public client site.`).join("\n")}\n\n## Legal\n- [Privacy](${origin}/clients/privacy)\n- [Terms](${origin}/clients/terms)\n- [Cookies](${origin}/clients/cookies)\n`;
}

export function createSitemap(origin: string, standaloneSlug?: string): string {
  const paths = standaloneSlug ? standaloneRoutePaths() : publicRoutePaths();
  const urls = [...new Set(paths)].map((path) => `<url><loc>${origin}${path}</loc></url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
}
