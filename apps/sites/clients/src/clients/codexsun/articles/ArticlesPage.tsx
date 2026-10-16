import type { CSSProperties } from "react";
import NavigationRail from "../components/NavigationRail";
import PrecisionCursor from "../components/PrecisionCursor";
import { CORE_LINE, INSIGHTS, SITE_TITLE } from "../public.constants";
import "../public-site.css";

export function ArticlesPage() {
  return (
    <div className="codexsun-public-site">
      <NavigationRail siteTitle={SITE_TITLE} coreLine={CORE_LINE} />
      <PrecisionCursor />
      <main className="article-page lg:ml-rail">
        <section className="article-index-shell">
          <a className="article-back" href="/#insights">
            &larr; Insights
          </a>
          <div className="article-index-header">
            <span>CODEXSUN / Articles</span>
            <h1 className="font-display uppercase">Build Room Notes</h1>
            <p>
              Notes on business platforms, clear workflows, useful AI and the discipline behind
              software worth keeping.
            </p>
          </div>

          <div className="article-index-list">
            {INSIGHTS.map((article, index) => (
              <a key={article.id} href={`/articles/${article.slug}`} className="article-index-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div
                  className="article-index-image"
                  style={{ "--article-image": `url(${article.image})` } as CSSProperties}
                />
                <div>
                  <small>{article.tag}</small>
                  <h2>{article.title}</h2>
                  <p>{article.excerpt}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
