import type { PageContent } from "@codexsun/sites-api/page-contract";
import type { BlogContent } from "@codexsun/sites-api/blog-contract";
import { ArrowUpRight } from "lucide-react";

export function RamutexJournal({ posts }: { posts: BlogContent[] }) {
  return (
    <section className="rt-wrap rt-journal">
      {posts.length ? (
        <div className="rt-journal-grid">
          {posts.map((post) => (
            <a href={`/blogs/${post.slug}`} key={post.slug} className="rt-journal-story">
              <span className="rt-eyebrow">FROM THE JOURNAL</span>
              <h2>{post.title}</h2>
              <p>{post.summary}</p>
              <span className="rt-editorial-link">
                Read article <ArrowUpRight size={18} />
              </span>
            </a>
          ))}
        </div>
      ) : (
        <div className="rt-journal-empty">
          <span className="rt-eyebrow">THE NEXT CHAPTER</span>
          <h2>
            More stories.
            <br />
            <em>In the making.</em>
          </h2>
          <p>
            Company news and textile insights will appear here when published. In the meantime,
            explore our processing capabilities or talk to our team about your fabric.
          </p>
          <a className="rt-text-link" href="/services">
            Explore our capabilities <ArrowUpRight size={18} />
          </a>
        </div>
      )}
    </section>
  );
}

export function RamutexArticle({ post }: { post: BlogContent }) {
  return (
    <article className="rt-reading rt-wrap">
      <p className="rt-reading-lead">{post.summary}</p>
      {post.body.split(/\n\s*\n/).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      <a className="rt-text-link" href="/blogs">
        Back to the journal <ArrowUpRight size={18} />
      </a>
    </article>
  );
}

export function RamutexPrivacy({ profile }: { profile: PageContent["profile"] }) {
  return (
    <section className="rt-reading rt-wrap">
      <p className="rt-reading-lead">How {profile.name} handles enquiries through this website.</p>
      <h2>Information you provide</h2>
      <p>
        The enquiry form collects your name, email address, optional company and phone details, and
        your message. We use these details to respond to your request.
      </p>
      <h2>Storage and retention</h2>
      <p>
        Enquiries are stored in this company’s website database. Submitted records are removed after
        90 days. We do not publish your enquiry or share it with other client websites.
      </p>
      <h2>Maps and WhatsApp</h2>
      <p>
        Interactive maps load only when you choose to load them. Google Maps and WhatsApp are
        external services with their own privacy policies. Opening those services may share
        technical information with their providers.
      </p>
      <h2>Contact and requests</h2>
      <p>
        To ask about your enquiry or request its deletion, contact our team through the details on
        the <a href="/contact">contact page</a>. Quote your enquiry reference when available.
      </p>
    </section>
  );
}
