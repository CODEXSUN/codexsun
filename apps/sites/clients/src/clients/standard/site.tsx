import { sitePathname } from "../../shared/sitePathname";
import { useMemo } from "react";
import { initialSitePage } from "@codexsun/sites-api/page-defaults";
import { useSitePublication } from "../../shared/useSitePublication";
import { PortfolioPages } from "../../shared/PortfolioPages";
import { useClientDocument } from "../../shared/useClientDocument";

export function StandardSite() {
  const slug = String(import.meta.env.CODEXSUN_SITES_CLIENT_SLUG);
  const initial = useMemo(
    () => initialSitePage({ id: 0, uuid: "00000000", slug, status: "active" }),
    [slug]
  );
  const { content, blogs, connected, published } = useSitePublication(slug, initial);
  const article = blogs.find((post) => sitePathname() === `/blogs/${post.slug}`);
  useClientDocument(
    article ? `${article.title} | ${content.profile.name}` : content.pageTitle,
    article?.summary ?? content.description,
    "#f4f7fc"
  );
  if (!published)
    return (
      <main className="portfolio-shell portfolio-main">
        <h1>Website awaiting publication</h1>
        <p>The site owner can publish this portfolio from its Site Studio workspace.</p>
      </main>
    );
  return <PortfolioPages content={content} blogs={blogs} connected={connected} />;
}
export default StandardSite;
