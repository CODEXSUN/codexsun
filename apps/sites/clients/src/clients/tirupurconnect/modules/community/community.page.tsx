import { useTextileContent } from "../../portal.content";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Clock3, Search } from "lucide-react";
import type { CommunityPost } from "@codexsun/tconnect-web/public";
import type { Association } from "@codexsun/tconnect-web/public";
export function CommunityPage({
  posts,
  associations,
  compact = false,
  postUuid
}: {
  posts: CommunityPost[];
  associations: Association[];
  compact?: boolean;
  postUuid?: string | undefined;
}) {
  const { community: copy } = useTextileContent();
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const selected = posts.find((post) => post.uuid === postUuid);
  if (postUuid) {
    if (!selected)
      return (
        <main className="tc-container tc-empty">
          <h1>Update not found</h1>
          <a href="/community">Back to community</a>
        </main>
      );
    const association = associations.find((item) => item.uuid === selected.associationUuid);
    return (
      <main className="tc-container tc-article-page">
        <a className="tc-back" href="/community">
          <ArrowLeft size={16} />
          Community & knowledge
        </a>
        <span className="tc-eyebrow">
          {selected.category} · {Math.max(1, Math.ceil(selected.body.split(/\s+/).length / 200))}{" "}
          min read
        </span>
        <h1>{selected.title}</h1>
        <div className="tc-article-byline">
          {association ? (
            <a href={`/associations/${association.slug}`}>{association.name}</a>
          ) : (
            "Industry community"
          )}
          {selected.eventDate ? (
            <time dateTime={selected.eventDate}>
              {new Date(`${selected.eventDate}T00:00:00Z`).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: "UTC"
              })}
            </time>
          ) : null}
        </div>
        <p className="tc-sample-note">
          Demonstration editorial content. Example events and opportunities are not confirmed
          announcements.
        </p>
        <article className="tc-article-body">
          {selected.body
            .split(/\n+/)
            .filter(Boolean)
            .map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
        </article>
        <aside className="tc-article-next">
          <h2>Turn an idea into a conversation.</h2>
          <p>Find businesses with the expertise your project needs.</p>
          <a className="tc-button" href="/companies">
            Explore textile businesses <ArrowUpRight size={17} />
          </a>
        </aside>
      </main>
    );
  }
  const filtered = posts.filter(
    (post) =>
      (category === "all" || post.category === category) &&
      `${post.title} ${post.body}`.toLowerCase().includes(search.toLowerCase())
  );
  const content = (
    <>
      {!compact ? (
        <>
          <div className="tc-page-intro">
            <span className="tc-eyebrow">{copy.label}</span>
            <h1>
              {copy.title}
              <br />
              <em>{copy.emphasis}</em>
            </h1>
            <p>{copy.intro}</p>
          </div>
          <div className="tc-community-filters">
            <label className="tc-search">
              <Search size={18} />
              <input
                aria-label="Search community"
                placeholder="Search insights and updates"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <div className="tc-discovery-tabs">
              {["all", "knowledge", "event", "opportunity", "announcement"].map((item) => (
                <button
                  key={item}
                  aria-pressed={category === item}
                  className={category === item ? "active" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item === "all" ? "All updates" : item}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
      <div className="tc-community-grid">
        {filtered.slice(0, compact ? 2 : 500).map((post, index) => {
          const association = associations.find((item) => item.uuid === post.associationUuid);
          return (
            <article className="tc-post" key={post.uuid}>
              <a
                className={`tc-post-art tc-post-art-${index % 3}`}
                href={`/community/${post.uuid}`}
                aria-label={`Read ${post.title}`}
              >
                <span>{post.category}</span>
              </a>
              <span className={`tc-post-category tc-${post.category}`}>{post.category}</span>
              <h3>
                <a href={`/community/${post.uuid}`}>{post.title}</a>
              </h3>
              <p>
                {post.body.slice(0, 170)}
                {post.body.length > 170 ? "…" : ""}
              </p>
              <div className="tc-post-source">
                {association ? (
                  <a href={`/associations/${association.slug}`}>{association.name}</a>
                ) : (
                  "Industry community"
                )}
                <span>
                  <Clock3 size={13} /> {Math.max(1, Math.ceil(post.body.split(/\s+/).length / 200))}{" "}
                  min
                </span>
              </div>
              <a href={`/community/${post.uuid}`} className="tc-text-link">
                Read the update <ArrowUpRight size={16} />
              </a>
            </article>
          );
        })}
      </div>
      {!filtered.length ? (
        <div className="tc-empty">
          <h3>No matching updates yet.</h3>
          <p>Try another topic or search.</p>
          <button
            className="tc-button"
            onClick={() => {
              setSearch("");
              setCategory("all");
            }}
          >
            Clear filters
          </button>
        </div>
      ) : null}
      <p className="tc-art-credit">
        Example articles, organizations and events are sample content until approved. Artwork is
        illustrative.
      </p>
    </>
  );
  return compact ? (
    <div className="tc-community-section">{content}</div>
  ) : (
    <main className="tc-container">{content}</main>
  );
}
