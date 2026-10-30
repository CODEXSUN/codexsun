"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { INSIGHTS } from "../public.constants";

type InsightDisplayItem = {
  id?: string;
  title: string;
  slug?: string;
  tag: string;
  excerpt?: string;
  publishedAt?: string;
  readTime?: string;
  visual?: "lines" | "signal" | "field" | string;
  image?: string;
};

function insightMeta(article: InsightDisplayItem) {
  if (article.tag) return article.tag;
  return [article.publishedAt, article.readTime].filter(Boolean).join(" / ");
}

function InsightPlate({ index, article }: { index: number; article: InsightDisplayItem }) {
  const visual = article.visual || ["lines", "signal", "field"][index % 3];

  return (
    <div
      className={`insight-plate insight-plate-${visual}`}
      style={
        article.image
          ? ({ "--insight-image": `url(${article.image})` } as CSSProperties)
          : undefined
      }
    >
      <span />
    </div>
  );
}

export default function InsightsSection({
  insights = INSIGHTS
}: {
  insights?: readonly InsightDisplayItem[];
}) {
  const visibleInsights = insights.slice(0, 3);

  return (
    <section
      id="insights"
      className="insights-page relative w-full overflow-hidden bg-carbon text-frost"
    >
      <div className="section-band insights-shell">
        <div className="insights-header">
          <motion.div
            initial={{ opacity: 0, x: -54, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="insights-kicker">Insights</span>
            <h2 className="insights-title font-display uppercase">
              Notes from
              <br />
              the build room.
            </h2>
          </motion.div>

          <motion.div
            className="insights-newsletter"
            initial={{ opacity: 0, x: -38 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ delay: 0.14, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            <span>Newsletter</span>
            <p>Letters on product, design, systems, and useful AI.</p>
            <form onSubmit={(event) => event.preventDefault()}>
              <label className="sr-only" htmlFor="newsletter-email">
                Your email
              </label>
              <input id="newsletter-email" type="email" placeholder="YOUR EMAIL" />
              <button type="submit" aria-label="Join newsletter">
                &rarr;
              </button>
            </form>
          </motion.div>
        </div>

        <div className="insights-feature-row">
          {visibleInsights.map((article, index) => (
            <motion.article
              key={article.id || article.slug || article.title}
              className="insight-story"
              initial={{ opacity: 0, x: -72, filter: "blur(12px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: false, margin: "-16% 0px" }}
              transition={{
                delay: index * 0.12,
                duration: 0.95,
                ease: [0.22, 1, 0.36, 1]
              }}
            >
              <div className="insight-story-index">{String(index + 1).padStart(2, "0")}</div>
              <InsightPlate index={index} article={article} />
              <div className="insight-story-copy">
                <span>{insightMeta(article)}</span>
                <h3>{article.title}</h3>
                {article.excerpt && <p>{article.excerpt}</p>}
                <a href={article.slug ? `/articles/${article.slug}` : "#contact"}>
                  Read article <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="insights-bottom">
          <span>Thinking that improves the work.</span>
          <a href="/articles">
            Read all articles <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
