import type { CSSProperties } from "react";
import MarkdownArticle from "../components/MarkdownArticle";
import NavigationRail from "../components/NavigationRail";
import PrecisionCursor from "../components/PrecisionCursor";
import { CORE_LINE, INSIGHTS, SITE_TITLE } from "../public.constants";
import "../public-site.css";

export function ArticlePage({ slug }: { slug: string }) {
  const article = INSIGHTS.find((item) => item.slug === slug);

  if (!article) {
    return (
      <div className="codexsun-public-site public-not-found">
        <a href="/articles">&larr; All articles</a>
        <h1>Article not found.</h1>
      </div>
    );
  }

  const nextArticle = INSIGHTS.find((item) => item.slug !== article.slug);

  return (
    <div className="codexsun-public-site">
      <NavigationRail siteTitle={SITE_TITLE} coreLine={CORE_LINE} />
      <PrecisionCursor />
      <main className="article-page lg:ml-rail">
        <article className="article-shell">
          <a className="article-back" href="/#insights">
            &larr; Insights
          </a>
          <header className="article-hero">
            <div>
              <span>{article.tag}</span>
              <h1 className="font-display uppercase">{article.title}</h1>
              <p>{article.excerpt}</p>
            </div>
            <div
              className="article-hero-image"
              style={{ "--article-image": `url(${article.image})` } as CSSProperties}
            />
          </header>
          <div className="article-body-grid">
            <aside className="article-meta">
              <span>Published</span>
              <strong>{article.publishedAt}</strong>
              <span>Read Time</span>
              <strong>{article.readTime}</strong>
              <span>Format</span>
              <strong>CODEXSUN Note</strong>
            </aside>
            <MarkdownArticle content={article.content} />
          </div>
          <footer className="article-footer">
            <a href="/articles">All Articles</a>
            {nextArticle ? (
              <a href={`/articles/${nextArticle.slug}`}>Next: {nextArticle.title}</a>
            ) : null}
          </footer>
        </article>
      </main>
    </div>
  );
}
