import type { BlogContent } from "@codexsun/sites-api/blog-contract";
import { ArrowUpRight } from "lucide-react";
export function RamutexBlogs({ posts }: { posts: BlogContent[] }) {
  if (!posts.length) return null;
  return (
    <section id="blogs" className="rt-section rt-wrap">
      <p className="rt-eyebrow">FROM RAMU TEX</p>
      <h2>
        Notes from <em>our studio.</em>
      </h2>
      <div className="rt-blog-grid">
        {posts.map((post) => (
          <article key={post.slug}>
            <h3>{post.title}</h3>
            <p>{post.summary}</p>
            <a className="rt-text-link" href={`/blogs/${post.slug}`}>
              Read article <ArrowUpRight size={16} />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
