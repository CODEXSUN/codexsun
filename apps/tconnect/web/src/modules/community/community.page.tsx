import type { CommunityPost } from "./community.types";
import type { Association } from "../association/association.types";
export function CommunityPage({
  posts,
  associations,
  compact = false
}: {
  posts: CommunityPost[];
  associations: Association[];
  compact?: boolean;
}) {
  return (
    <section className={compact ? "tc-community-section" : "tc-container"}>
      {!compact ? (
        <div className="tc-page-intro">
          <span className="tc-eyebrow">THE COMMUNITY BOARD</span>
          <h1>
            Knowledge shared.
            <br />
            Possibilities multiplied.
          </h1>
          <p>Ideas, conversations and opportunities from the people who make things happen.</p>
        </div>
      ) : null}
      <div className="tc-community-grid">
        {posts.slice(0, compact ? 3 : 500).map((post) => {
          const association = associations.find((item) => item.uuid === post.associationUuid);
          return (
            <article className="tc-post" key={post.uuid}>
              <span className={`tc-post-category tc-${post.category}`}>{post.category}</span>
              <h3>{post.title}</h3>
              <p>{post.body}</p>
              <div className="tc-post-source">
                {association ? (
                  <a href={`/associations/${association.slug}`}>{association.name}</a>
                ) : (
                  "Industry community"
                )}
                {post.eventDate ? (
                  <time>{post.eventDate.split("-").reverse().join("-")}</time>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {!posts.length ? <p className="tc-empty">No published updates yet.</p> : null}
    </section>
  );
}
